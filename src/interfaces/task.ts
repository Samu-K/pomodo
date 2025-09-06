export interface CustomRecurrance {
	repeat_every_x: number;
	repeat_type: string;

	repeat_on_days: Array<string>;
	repeat_monthly_type: string | undefined;

	repeat_until_type: string;
	repeat_until_date: Date | undefined;
	repeat_until_times: number | undefined;
}

export interface Task {
	id: number;
	title: string;
	category: string;
	cycles: number;
	startTime: Date;
	completed: boolean;
	recurrance: CustomRecurrance;
	gradient: string;
}
