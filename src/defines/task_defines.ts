import type { Day } from "../interfaces/helpers.ts";

// Array of days to be rendered.
const days: Day[] = [
	{ id: "sunday", label: "S" },
	{ id: "monday", label: "M" },
	{ id: "tuesday", label: "T" },
	{ id: "wednesday", label: "W" },
	{ id: "thursday", label: "T" },
	{ id: "friday", label: "F" },
	{ id: "saturday", label: "S" },
];

const recurranceOpts = [
	"No repeat",
	"Daily",
	"Weekly",
	"Monthly",
	"Yearly",
	"Weekdays",
	"Custom",
];
const monthlyCustomTypes = [
	"This day each month",
	"first weekday of each month",
];
const customRecurranceOpts = ["day", "week", "month", "year"];

export { days, recurranceOpts, monthlyCustomTypes, customRecurranceOpts };
