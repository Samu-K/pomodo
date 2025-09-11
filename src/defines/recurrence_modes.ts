import type { Day } from "@/defines/task_defines.ts";

export enum RecurrenceType {
	NONE = "None",
	DAILY = "Daily",
	WEEKDAYS = "Weekdays",
	WEEKLY = "Weekly",
	MONTHLY = "Monthly",
	YEARLY = "Yearly",
	CUSTOM = "Custom"
}

export enum CustomRecurrenceType {
	DAILY = "day",
	WEEKLY = "week",
	MONTHLY = "month",
	YEARLY = "year"
}

export enum MonthlyRepeatType {
	ON_TASK_DATE = "Same date as task", // Same date each month (e.g., 15th of every month)
	FIRST_TASK_WEEKDAY_OF_MONTH = "First task day of month" // First occurrence of weekday (e.g., first Saturday)
}

// When the recurrence should end
export enum RepeatUntilType {
	REPEAT_FOREVER = "one",
	REPEAT_UNTIL_DATE = "two",
	REPEAT_UNTIL_TIMES = "three"
}

// Base interface with common properties
interface BaseRecurrence {
	repeatUntilType: RepeatUntilType;
	repeatUntilDate?: Date; // Required when repeatUntilType is REPEAT_UNTIL_DATE
	repeatUntilTimes?: number; // Required when repeatUntilType is REPEAT_UNTIL_TIMES
}

interface DailyRecurrence extends BaseRecurrence {
	type: RecurrenceType.DAILY;
}

interface WeeklyRecurrence extends BaseRecurrence {
	type: RecurrenceType.WEEKLY;
}

interface WeekdayRecurrance extends BaseRecurrence {
	type: RecurrenceType.WEEKDAYS;
}

interface MonthlyRecurrence extends BaseRecurrence {
	type: RecurrenceType.MONTHLY;
}

interface YearlyRecurrence extends BaseRecurrence {
	type: RecurrenceType.YEARLY;
}

export interface NoRecurrence {
	type: RecurrenceType.NONE;
}

// Custom recurrence with full control
export interface CustomRecurrence extends BaseRecurrence {
	type: RecurrenceType.CUSTOM;
	customType: CustomRecurrenceType;
	repeatEveryX: number; // How many days/weeks/months/years between occurrences

	// Optional - only for weekly custom recurrence
	repeatOnDays?: Day[];

	// Optional - only for monthly custom recurrence
	monthlyType?: MonthlyRepeatType;
}

export type Recurrence =
	| NoRecurrence
	| DailyRecurrence
	| WeekdayRecurrance
	| WeeklyRecurrence
	| MonthlyRecurrence
	| YearlyRecurrence
	| CustomRecurrence;
