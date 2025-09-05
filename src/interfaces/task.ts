export interface Task {
	id: number;
	title: string;
	category: string;
	cycles: number;
	startTime: Date;
	completed: boolean;
	gradient: string;
}
