import { describe, expect, it } from "vitest";
import {
	CustomRecurrenceType,
	MonthlyRepeatType,
	RecurrenceType,
	RepeatUntilType
} from "../../defines/recur";
import { buildRRuleAndUntil } from "../task";

describe("Task Functions", () => {
	describe("buildRRuleAndUntil", () => {
		const baseStartTime = new Date("2024-03-15T10:00:00Z"); // Friday

		describe("Simple Recurrence Types", () => {
			it("builds DAILY recurrence rule", () => {
				const result = buildRRuleAndUntil(
					{
						type: RecurrenceType.DAILY,
						repeatUntilType: RepeatUntilType.REPEAT_FOREVER
					},
					baseStartTime
				);
				expect(result.rrule).toBe("FREQ=DAILY");
				expect(result.untilIso).toBeNull();
			});

			it("builds WEEKDAYS recurrence rule", () => {
				const result = buildRRuleAndUntil(
					{
						type: RecurrenceType.WEEKDAYS,
						repeatUntilType: RepeatUntilType.REPEAT_FOREVER
					},
					baseStartTime
				);
				expect(result.rrule).toBe("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR");
				expect(result.untilIso).toBeNull();
			});

			it("builds WEEKLY recurrence rule based on start day", () => {
				// Friday = day 5
				const result = buildRRuleAndUntil(
					{
						type: RecurrenceType.WEEKLY,
						repeatUntilType: RepeatUntilType.REPEAT_FOREVER
					},
					baseStartTime
				);
				expect(result.rrule).toBe("FREQ=WEEKLY;BYDAY=FR");
			});

			it("builds WEEKLY recurrence rule for Monday", () => {
				const monday = new Date("2024-03-18T10:00:00Z"); // Monday
				const result = buildRRuleAndUntil(
					{
						type: RecurrenceType.WEEKLY,
						repeatUntilType: RepeatUntilType.REPEAT_FOREVER
					},
					monday
				);
				expect(result.rrule).toBe("FREQ=WEEKLY;BYDAY=MO");
			});

			it("builds MONTHLY recurrence rule", () => {
				const result = buildRRuleAndUntil(
					{
						type: RecurrenceType.MONTHLY,
						repeatUntilType: RepeatUntilType.REPEAT_FOREVER
					},
					baseStartTime
				);
				expect(result.rrule).toBe("FREQ=MONTHLY;BYMONTHDAY=15");
			});

			it("builds YEARLY recurrence rule", () => {
				const result = buildRRuleAndUntil(
					{
						type: RecurrenceType.YEARLY,
						repeatUntilType: RepeatUntilType.REPEAT_FOREVER
					},
					baseStartTime
				);
				expect(result.rrule).toBe("FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=15");
			});
		});

		describe("Custom Recurrence Types", () => {
			it("builds custom DAILY recurrence with interval", () => {
				const result = buildRRuleAndUntil(
					{
						type: RecurrenceType.CUSTOM,
						customType: CustomRecurrenceType.DAILY,
						repeatEveryX: 3,
						repeatUntilType: RepeatUntilType.REPEAT_FOREVER
					},
					baseStartTime
				);
				expect(result.rrule).toBe("FREQ=DAILY;INTERVAL=3");
			});

			it("builds custom WEEKLY recurrence with specific days", () => {
				const result = buildRRuleAndUntil(
					{
						type: RecurrenceType.CUSTOM,
						customType: CustomRecurrenceType.WEEKLY,
						repeatEveryX: 2,
						repeatOnDays: [
							{ id: "MO", label: "M" },
							{ id: "WE", label: "W" }
						],
						repeatUntilType: RepeatUntilType.REPEAT_FOREVER
					},
					baseStartTime
				);
				expect(result.rrule).toBe("FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE");
			});

			it("builds custom WEEKLY recurrence without specific days (uses start day)", () => {
				const result = buildRRuleAndUntil(
					{
						type: RecurrenceType.CUSTOM,
						customType: CustomRecurrenceType.WEEKLY,
						repeatEveryX: 1,
						repeatUntilType: RepeatUntilType.REPEAT_FOREVER
					},
					baseStartTime
				);
				expect(result.rrule).toBe("FREQ=WEEKLY;BYDAY=FR");
			});

			it("builds custom MONTHLY recurrence on same date", () => {
				const result = buildRRuleAndUntil(
					{
						type: RecurrenceType.CUSTOM,
						customType: CustomRecurrenceType.MONTHLY,
						repeatEveryX: 2,
						monthlyType: MonthlyRepeatType.ON_TASK_DATE,
						repeatUntilType: RepeatUntilType.REPEAT_FOREVER
					},
					baseStartTime
				);
				expect(result.rrule).toBe("FREQ=MONTHLY;INTERVAL=2;BYMONTHDAY=15");
			});

			it("builds custom MONTHLY recurrence on first weekday of month", () => {
				// March 15, 2024 is the third Friday of March
				const result = buildRRuleAndUntil(
					{
						type: RecurrenceType.CUSTOM,
						customType: CustomRecurrenceType.MONTHLY,
						repeatEveryX: 1,
						monthlyType: MonthlyRepeatType.FIRST_TASK_WEEKDAY_OF_MONTH,
						repeatUntilType: RepeatUntilType.REPEAT_FOREVER
					},
					baseStartTime
				);
				expect(result.rrule).toBe("FREQ=MONTHLY;BYDAY=3FR");
			});

			it("builds custom YEARLY recurrence", () => {
				const result = buildRRuleAndUntil(
					{
						type: RecurrenceType.CUSTOM,
						customType: CustomRecurrenceType.YEARLY,
						repeatEveryX: 2,
						repeatUntilType: RepeatUntilType.REPEAT_FOREVER
					},
					baseStartTime
				);
				expect(result.rrule).toBe(
					"FREQ=YEARLY;INTERVAL=2;BYMONTH=3;BYMONTHDAY=15"
				);
			});
		});

		describe("Repeat Until Options", () => {
			it("handles REPEAT_FOREVER", () => {
				const result = buildRRuleAndUntil(
					{
						type: RecurrenceType.DAILY,
						repeatUntilType: RepeatUntilType.REPEAT_FOREVER
					},
					baseStartTime
				);
				expect(result.rrule).toBe("FREQ=DAILY");
				expect(result.untilIso).toBeNull();
			});

			it("handles REPEAT_UNTIL_DATE", () => {
				const untilDate = new Date("2024-12-31T00:00:00Z");
				const result = buildRRuleAndUntil(
					{
						type: RecurrenceType.DAILY,
						repeatUntilType: RepeatUntilType.REPEAT_UNTIL_DATE,
						repeatUntilDate: untilDate
					},
					baseStartTime
				);
				expect(result.rrule).toBe("FREQ=DAILY");
				expect(result.untilIso).not.toBeNull();
				// untilIso should be end of day
				expect(result.untilIso).toContain("2024-12-31");
			});

			it("handles REPEAT_UNTIL_TIMES (COUNT)", () => {
				const result = buildRRuleAndUntil(
					{
						type: RecurrenceType.DAILY,
						repeatUntilType: RepeatUntilType.REPEAT_UNTIL_TIMES,
						repeatUntilTimes: 10
					},
					baseStartTime
				);
				expect(result.rrule).toBe("FREQ=DAILY;COUNT=10");
				expect(result.untilIso).toBeNull();
			});

			it("throws error when REPEAT_UNTIL_DATE is missing date", () => {
				expect(() =>
					buildRRuleAndUntil(
						{
							type: RecurrenceType.DAILY,
							repeatUntilType: RepeatUntilType.REPEAT_UNTIL_DATE
						},
						baseStartTime
					)
				).toThrow("repeatUntilDate required");
			});

			it("throws error when REPEAT_UNTIL_TIMES is missing count", () => {
				expect(() =>
					buildRRuleAndUntil(
						{
							type: RecurrenceType.DAILY,
							repeatUntilType: RepeatUntilType.REPEAT_UNTIL_TIMES
						},
						baseStartTime
					)
				).toThrow("repeatUntilTimes required");
			});
		});
	});
});
