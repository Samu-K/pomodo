import { invoke } from "@tauri-apps/api/core";
import type { Session } from "@/defines/session";

const add_session = async (session: Session) => {
	const res = await invoke("session_add_session", { session: session });
	return res;
};

const delete_session = async (session_id: number) => {
	const res = await invoke("session_delete_session", {
		session_id: session_id
	});
	return res;
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
		await invoke("session_set_session_complete", { id: session_id });
	}
};

const get_sessions = async () => {
	const sessions = await invoke<Session[]>("session_get_sessions");
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
