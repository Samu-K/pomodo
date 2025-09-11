import { invoke } from "@tauri-apps/api/core";
import {
	type CustomRecurrence,
	CustomRecurrenceType,
	MonthlyRepeatType,
	type NoRecurrence,
	type Recurrence,
	RecurrenceType,
	RepeatUntilType
} from "../defines/recurrence_modes.ts";
import type { Task } from "../interfaces/task.ts";

const cycleLen = 25;

interface DatabaseCategory {
	id: number;
	name: string;
	color?: string;
}

/** Build RRULE + optional UNTIL ISO using strict switch style.
 *  Backend should interpret dtstartIso + timezone together.
 */
function buildRRuleAndUntil(
	recurrence: Exclude<Recurrence, NoRecurrence>,
	startTime: Date
): { rrule: string; untilIso?: string | null } {
	const rruleParts: string[] = [];
	let untilIso: string | null = null;

	switch (recurrence.type) {
		case RecurrenceType.DAILY:
			rruleParts.push("FREQ=DAILY");
			break;

		case RecurrenceType.WEEKDAYS:
			rruleParts.push("FREQ=WEEKLY");
			rruleParts.push("BYDAY=MO,TU,WE,TH,FR");
			break;

		case RecurrenceType.WEEKLY: {
			rruleParts.push("FREQ=WEEKLY");
			const mapping = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
			rruleParts.push(`BYDAY=${mapping[startTime.getDay()]}`);
			break;
		}

		case RecurrenceType.MONTHLY:
			rruleParts.push("FREQ=MONTHLY");
			rruleParts.push(`BYMONTHDAY=${startTime.getDate()}`);
			break;

		case RecurrenceType.YEARLY:
			rruleParts.push("FREQ=YEARLY");
			rruleParts.push(`BYMONTH=${startTime.getMonth() + 1}`);
			rruleParts.push(`BYMONTHDAY=${startTime.getDate()}`);
			break;

		case RecurrenceType.CUSTOM: {
			const r = recurrence as CustomRecurrence;
			switch (r.customType) {
				case CustomRecurrenceType.DAILY:
					rruleParts.push("FREQ=DAILY");
					if (r.repeatEveryX > 1) rruleParts.push(`INTERVAL=${r.repeatEveryX}`);
					break;

				case CustomRecurrenceType.WEEKLY:
					rruleParts.push("FREQ=WEEKLY");
					if (r.repeatEveryX > 1) rruleParts.push(`INTERVAL=${r.repeatEveryX}`);
					if (r.repeatOnDays && r.repeatOnDays.length > 0) {
						const days = r.repeatOnDays.map((d) => d.id).join(",");
						rruleParts.push(`BYDAY=${days}`);
					} else {
						const mapping = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
						rruleParts.push(`BYDAY=${mapping[startTime.getDay()]}`);
					}
					break;

				case CustomRecurrenceType.MONTHLY:
					rruleParts.push("FREQ=MONTHLY");
					if (r.repeatEveryX > 1) rruleParts.push(`INTERVAL=${r.repeatEveryX}`);
					if (r.monthlyType === MonthlyRepeatType.FIRST_TASK_WEEKDAY_OF_MONTH) {
						const dt = new Date(startTime);
						const ordinal = Math.ceil(dt.getDate() / 7);
						const mapping = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
						rruleParts.push(`BYDAY=${ordinal}${mapping[dt.getDay()]}`);
					} else {
						rruleParts.push(`BYMONTHDAY=${startTime.getDate()}`);
					}
					break;

				case CustomRecurrenceType.YEARLY:
					rruleParts.push("FREQ=YEARLY");
					if (r.repeatEveryX > 1) rruleParts.push(`INTERVAL=${r.repeatEveryX}`);
					rruleParts.push(`BYMONTH=${startTime.getMonth() + 1}`);
					rruleParts.push(`BYMONTHDAY=${startTime.getDate()}`);
					break;

				default:
					throw new Error("Unsupported custom recurrence type");
			}
			break;
		}

		default:
			throw new Error("Unsupported recurrence type");
	}

	switch (recurrence.repeatUntilType) {
		case RepeatUntilType.REPEAT_FOREVER:
			// nothing
			break;
		case RepeatUntilType.REPEAT_UNTIL_DATE: {
			if (!recurrence.repeatUntilDate)
				throw new Error("repeatUntilDate required");
			const d = new Date(recurrence.repeatUntilDate);
			d.setHours(23, 59, 59, 0);
			untilIso = d.toISOString();
			break;
		}
		case RepeatUntilType.REPEAT_UNTIL_TIMES: {
			if (!recurrence.repeatUntilTimes)
				throw new Error("repeatUntilTimes required");
			rruleParts.push(`COUNT=${recurrence.repeatUntilTimes}`);
			break;
		}
		default:
			throw new Error("Unknown repeatUntilType");
	}
	return { rrule: rruleParts.join(";"), untilIso };
}

/** Strict, switch-based flow for creating task + recurrence via Rust bindings on window */
export async function createTaskWithRecurrence(
	task: Task
): Promise<{ task_id: number; rule_id: number }> {
	// Validate essential task fields
	if (!task.title || task.title.trim() === "")
		throw new Error("Task title required");
	if (!task.category || task.category.trim() === "")
		throw new Error("Task category required");
	if (!task.cycles || task.cycles <= 0)
		throw new Error("Task cycles must be > 0");

	let categoryId: number = -99;
	try {
		const cat: DatabaseCategory = await invoke(
			"categories_get_category_by_name",
			{
				cat_name: task.category
			}
		);
		categoryId = cat.id;
	} catch (_error) {
		console.log("No category found, creating new one..");
		const newCat: DatabaseCategory = {
			id: 0,
			name: task.category
		};
		const cat_id: number = await invoke("categories_add_category", {
			cat: newCat
		});
		categoryId = cat_id;
	}

	if (categoryId === -99) {
		console.error("Category id not set");
		return { task_id: -99, rule_id: -99 };
	}

	const taskDuration = task.cycles * cycleLen;
	const deadline = new Date(
		task.startTime.setTime(task.startTime.getTime() + taskDuration * 60 * 1000)
	);

	// 2) Build task payload for Rust
	const taskPayload = {
		title: task.title,
		category_id: categoryId,
		estimated_cycles: task.cycles,
		estimated_duration_seconds: null,
		is_recurring: task.recurrence.type !== RecurrenceType.NONE,
		series_id: null,
		completed: task.completed,
		description: task.description ?? null,
		// cut out timezone
		deadline: deadline.toISOString().slice(0, 19),
		created_at: null,
		updated_at: null
	};

	let task_id = 0;
	await invoke("task_add_task", { task: taskPayload })
		.then((new_task_id) => {
			console.log(new_task_id);
			task_id = Number(new_task_id);
		})
		.catch((error) => console.log(error));

	// 3) Strict switch: handle recurrence types explicitly
	switch (task.recurrence.type) {
		case RecurrenceType.NONE:
			// nothing to create
			return { task_id, rule_id: 0 };

		case RecurrenceType.DAILY:
		case RecurrenceType.WEEKDAYS:
		case RecurrenceType.WEEKLY:
		case RecurrenceType.MONTHLY:
		case RecurrenceType.YEARLY:
			// For the built-in recurrence types we rely on buildRRuleAndUntil to create correct RRULE.
			// No additional client-side validation required here (but you can add if desired).
			break;

		case RecurrenceType.CUSTOM: {
			// Validate required custom fields in an explicit, type-safe way
			const r = task.recurrence as CustomRecurrence;

			switch (r.customType) {
				case CustomRecurrenceType.DAILY:
				case CustomRecurrenceType.MONTHLY:
				case CustomRecurrenceType.YEARLY:
					// require repeatEveryX > 0
					if (!r.repeatEveryX || r.repeatEveryX < 1) {
						throw new Error("repeatEveryX must be >= 1 for custom recurrence");
					}
					break;
				case CustomRecurrenceType.WEEKLY:
					// either repeatOnDays present OR we will fallback to startTime's weekday;
					// choose whether to enforce presence or allow fallback; below we allow fallback.
					if (r.repeatEveryX !== undefined && r.repeatEveryX < 1) {
						throw new Error(
							"repeatEveryX must be >= 1 for weekly custom recurrence"
						);
					}
					break;
				default:
					throw new Error("Unsupported custom recurrence type");
			}
			break;
		}

		default:
			throw new Error("Unhandled recurrence type");
	}
	// Build RRULE + until
	const { rrule, untilIso } = buildRRuleAndUntil(
		task.recurrence,
		task.startTime
	);
	if (!rrule || rrule.trim() === "") {
		throw new Error("Failed to build RRULE");
	}

	// timezone string from client
	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
	const dtstartIso = new Date(task.startTime).toISOString();

	let rule_id = -99;
	try {
		rule_id = await invoke("task_add_rule", {
			task_id: task_id,
			rrule: rrule,
			dtstart: dtstartIso.slice(0, 19),
			until: untilIso ? untilIso.slice(0, 19) : null,
			timezone: timezone
		});
	} catch (error) {
		console.log("Error with adding rule");
		console.log(error);
	}

	return { task_id, rule_id };
}
