import type { Recurrence } from "../defines/recurrence_modes.ts";

export interface Task {
	id: number;
	title: string;
	description?: string;
	category: string;
	cycles: number;
	startTime: Date;
	completed: boolean;
	recurrence: Recurrence;
	gradient: string;
}
