import type { Session } from "../commands";
import { commands } from "../commands";

const add_session = async (session: Session) => {
	const res = await commands.sessionAddSession(session);
	if (res.status === "error") throw new Error(res.error.message);
	return res.data;
};

const delete_session = async (session_id: number) => {
	const res = await commands.sessionDeleteSession(session_id);
	if (res.status === "error") throw new Error(res.error.message);
	return res.data;
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
