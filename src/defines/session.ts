export interface Session {
	id: number;
	start_time: Date;
	duration: number | undefined;
	finished: boolean;
	category_id: number;
}
