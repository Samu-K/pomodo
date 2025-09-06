import { monthlyCustomTypes } from "../defines/task_defines";

export interface Day {
	id: string;
	label: string;
}

export const NoRecurrance = {
	repeat_every_x: 1,
	repeat_type: "week",

	repeat_on_days: [],
	repeat_monthly_type: monthlyCustomTypes[0],

	repeat_until_type: "one",
	repeat_until_date: undefined,
	repeat_until_times: 1,
};
