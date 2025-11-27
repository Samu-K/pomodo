import type { Session } from "../commands";
import { commands } from "../commands";

const add_session = async (session: Session) => {
	const res = await commands.sessionAddSession(session);
	if (res.status === "error") throw new Error(res.error.message);
	return res.data;
};

const delete_session = async (session_id: number) => {
	console.log(
		`[delete_session] Attempting to delete session with ID: ${session_id}, type: ${typeof session_id}`
	);
	try {
		const res = await commands.sessionDeleteSession(session_id);
		console.log(`[delete_session] Backend response status:`, res.status);
		if (res.status === "error") {
			console.error(
				`[delete_session] Backend error for session ${session_id}:`,
				res.error
			);
			console.error(`[delete_session] Error message:`, res.error.message);
			return null; // Return null instead of throwing
		}
		console.log(`[delete_session] Successfully deleted session ${session_id}`);
		return res.data;
	} catch (error) {
		// The commands wrapper throws errors in some cases (see commands.ts line 140)
		console.error(
			`[delete_session] Exception thrown while deleting session ${session_id}:`,
			error
		);
		if (error instanceof Error) {
			console.error(`[delete_session] Error message:`, error.message);
			console.error(`[delete_session] Error stack:`, error.stack);
		}
		return null;
	}
};

const delete_latest_session = async () => {
	const sessions = await get_sessions();
	if (sessions.length === 0) {
		return;
	}
	const id = sessions[sessions.length - 1].id;
	if (id) {
		const res = await delete_session(id);
		return res;
	}
};

const set_newest_session_complete = async () => {
	const sessions = await get_sessions();
	if (sessions.length === 0) {
		return;
	}
	const indx = sessions.length - 1;
	const session_id = sessions[indx].id;
	if (session_id) {
		const res = await commands.sessionSetSessionComplete(session_id);
		if (res.status === "error") throw new Error(res.error.message);
		return res.data;
	}
};

const get_sessions = async () => {
	const res = await commands.sessionGetSessions();
	if (res.status === "error") throw new Error(res.error.message);
	const sessions = res.data;
	if (sessions && sessions.length > 0) {
		return sessions;
	} else {
		return [];
	}
};

const clear_all_sessions = async () => {
	const sessions = await get_sessions();
	if (sessions.length > 0) {
		for (const session of sessions) {
			if (session.id) {
				await delete_session(session.id);
			}
		}
	}
};

export {
	add_session,
	delete_session,
	get_sessions,
	set_newest_session_complete,
	delete_latest_session,
	clear_all_sessions
};
