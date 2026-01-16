export type Category = { id: number; name: string; color: string | null };
export type Project = {
	id: number;
	name: string;
	description: string | null;
	color: string | null;
	estimated_pomodoros: number | null;
	category_id: number | null;
	is_completed: boolean;
	created_at: string | null;
};
export type Session = {
	id: number | null;
	start_time: string;
	duration: number | null;
	finished: boolean;
	category_id: number | null;
	task_id: number | null;
	project_id: number | null;
	notes: string | null;
	created_at: string | null;
	last_modified: string | null;
};
export type Setting = {
	id: number;
	key: string;
	description: string | null;
	value: string;
	category_id: number;
	data_type: string;
};
export type SettingCategory = { id: number; name: string };
export type Task = {
	id: number;
	title: string;
	description: string | null;
	category_id: number | null;
	project_id: number | null;
	estimated_pomodoros: number | null;
	start_datetime: string | null;
	recurrence_rule: string | null;
	is_completed: boolean;
	completed_pomodoros?: number;
	parent_task_id: number | null;
	created_at: string | null;
};
