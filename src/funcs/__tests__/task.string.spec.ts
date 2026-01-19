import { describe, expect, it } from "vitest";
import {
	CustomRecurrenceType,
	RecurrenceType,
	RepeatUntilType
} from "../../defines/recur";
import type { Task } from "../../defines/task";
import { getRecurrenceString } from "../task";

describe("Task Functions: String Generation", () => {
	const baseTask: Task = {
		id: 1,
		title: "Test Task",
		category: null,
		category_id: null,
		project_id: null,
		cycles: 1,
		startTime: new Date("2024-03-15T10:00:00Z"),
		completed: false,
		completedCycles: 0,
		gradient: "from-pomodo-orange to-pomodo-red"
	};

	it("returns undefined for NONE recurrence", () => {
		const task: Task = {
			...baseTask,
			recurrence: { type: RecurrenceType.NONE }
		};
		expect(getRecurrenceString(task)).toBeUndefined();
	});

	it("returns undefined when recurrence is undefined", () => {
		const task: Task = { ...baseTask };
		expect(getRecurrenceString(task)).toBeUndefined();
	});

	it("returns RRULE string for daily recurrence", () => {
		const task: Task = {
			...baseTask,
			recurrence: {
				type: RecurrenceType.DAILY,
				repeatUntilType: RepeatUntilType.REPEAT_FOREVER
			}
		};
		expect(getRecurrenceString(task)).toBe("FREQ=DAILY");
	});

	it("returns RRULE string with UNTIL for date-limited recurrence", () => {
		const task: Task = {
			...baseTask,
			recurrence: {
				type: RecurrenceType.DAILY,
				repeatUntilType: RepeatUntilType.REPEAT_UNTIL_DATE,
				repeatUntilDate: new Date("2024-12-31T00:00:00Z")
			}
		};
		const result = getRecurrenceString(task);
		expect(result).toContain("FREQ=DAILY");
		expect(result).toContain("UNTIL=");
	});

	it("returns RRULE string with COUNT for count-limited recurrence", () => {
		const task: Task = {
			...baseTask,
			recurrence: {
				type: RecurrenceType.WEEKLY,
				repeatUntilType: RepeatUntilType.REPEAT_UNTIL_TIMES,
				repeatUntilTimes: 5
			}
		};
		const result = getRecurrenceString(task);
		expect(result).toContain("FREQ=WEEKLY");
		expect(result).toContain("COUNT=5");
	});

	it("returns complex RRULE for custom weekly recurrence", () => {
		const task: Task = {
			...baseTask,
			recurrence: {
				type: RecurrenceType.CUSTOM,
				customType: CustomRecurrenceType.WEEKLY,
				repeatEveryX: 2,
				repeatOnDays: [
					{ id: "MO", label: "M" },
					{ id: "FR", label: "F" }
				],
				repeatUntilType: RepeatUntilType.REPEAT_FOREVER
			}
		};
		const result = getRecurrenceString(task);
		expect(result).toBe("FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR");
	});
});
