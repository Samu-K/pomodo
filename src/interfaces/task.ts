import type { Recurrence } from "@/defines/recurrance_modes";

export interface Task {
	id: number;
	title: string;
	category: string;
	cycles: number;
	startTime: Date;
	completed: boolean;
	recurrence: Recurrence;
	gradient: string;
}
