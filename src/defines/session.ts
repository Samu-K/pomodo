export interface Session {
	id: number;
	start_time: string;
	duration: number | undefined;
	finished: boolean;
	category_id: number;
	notes: string | null;
	created_at: string | null;
	last_modified: string | null;
}
