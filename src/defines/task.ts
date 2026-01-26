import type { Recurrence } from "./recur.ts";

export interface Task {
	id: number;
	title: string;
	description?: string;
	category: string | null;
	category_id: number | null;
	project_id: number | null;
	cycles: number;
	startTime: Date;
	completed: boolean;
	completedCycles: number;
	recurrence_rule?: string;
	recurrence?: Recurrence;
	gradient: string;
	parent_task_id?: number;
}
