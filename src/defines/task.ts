import type { Recurrence } from "./recur.ts";

export interface Task {
	id: number;
	title: string;
	description?: string;
	category: string | null;
	category_id: number | null;
	cycles: number; // estimated_pomodoros
	startTime: Date; // start_datetime
	completed: boolean; // is_completed
	completedCycles: number;
	recurrence_rule?: string;
	recurrence?: Recurrence; // Optional, for UI state before saving
	gradient: string;
	parent_task_id?: number;
}
