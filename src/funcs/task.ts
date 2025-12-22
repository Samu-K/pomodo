import {
	type CustomRecurrence,
	CustomRecurrenceType,
	MonthlyRepeatType,
	type NoRecurrence,
	type Recurrence,
	RecurrenceType,
	RepeatUntilType
} from "../defines/recur.ts";
import type { Task } from "../defines/task.ts";

const _cycleLen = 25;

export interface DatabaseCategory {
	id: number;
	name: string;
	color?: string;
}

/** Build RRULE + optional UNTIL ISO using strict switch style.
 *  Backend should interpret dtstartIso + timezone together.
 */
export function buildRRuleAndUntil(
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

/**
 * Helper to build the RRULE string from the Task/Recurrence object.
 */
export function getRecurrenceString(task: Task): string | undefined {
	if (task.recurrence?.type === RecurrenceType.NONE) return undefined;
	if (!task.recurrence) return undefined;

	const { rrule, untilIso } = buildRRuleAndUntil(
		task.recurrence,
		task.startTime
	);

	let finalRule = rrule;
	if (untilIso) {
		// Remove hyphens/colons for standard iCal format: YYYYMMDDTHHMMSSZ
		const formattedUntil = `${untilIso.replace(/[-:]/g, "").split(".")[0]}Z`;
		finalRule += `;UNTIL=${formattedUntil}`;
	}
	return finalRule;
}
