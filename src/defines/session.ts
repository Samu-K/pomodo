export interface Session {
	id: number | null;
	start_time: string;
	duration: number;
	finished: boolean;
	category_id: number | null;
	notes: string | null;
	created_at: string | null;
	last_modified: string | null;
}
