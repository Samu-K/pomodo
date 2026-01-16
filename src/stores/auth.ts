import { defineStore } from "pinia";
import { ref } from "vue";
import { commands } from "../funcs/commands";

export interface SupabaseUser {
	id: string;
	email?: string | null;
}

export interface SupabaseSession {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	user: SupabaseUser;
}

export const useAuthStore = defineStore("auth", () => {
	const session = ref<SupabaseSession | null>(null);
	const isAuthenticated = ref(false);

	// Initialize from local storage
	const stored = localStorage.getItem("sb_session");
	if (stored) {
		try {
			session.value = JSON.parse(stored);
			isAuthenticated.value = true;
		} catch (e) {
			console.error("Failed to parse session", e);
			localStorage.removeItem("sb_session");
		}
	}

	function setSession(sess: SupabaseSession) {
		session.value = sess;
		isAuthenticated.value = true;
		localStorage.setItem("sb_session", JSON.stringify(sess));
	}

	function logout() {
		session.value = null;
		isAuthenticated.value = false;
		localStorage.removeItem("sb_session");
	}

	async function login(email: string, pass: string) {
		const res = await commands.supabaseLogin(email, pass);
		if (res.status === "error") throw new Error(res.error);

		setSession(res.data);
		return res.data;
	}

	async function signup(email: string, pass: string) {
		const res = await commands.supabaseSignup(email, pass);
		if (res.status === "error") throw new Error(res.error);

		const sess = res.data;
		// If sess is null, it means confirmation is needed.
		if (sess) {
			setSession(sess);
		}
		return sess;
	}

	// Last Sync Time Logic
	const lastSyncTime = ref<string | null>(
		localStorage.getItem("pomodo-last-sync")
	);

	function updateLastSync() {
		const now = new Date().toLocaleString();
		lastSyncTime.value = now;
		localStorage.setItem("pomodo-last-sync", now);
	}

	async function syncNow() {
		await commands.supabaseSyncNow();
		updateLastSync();
	}

	async function restore() {
		await commands.supabaseRestore();
		updateLastSync();
	}

	async function checkUpdates() {
		return await commands.supabaseCheckUpdates();
	}

	return {
		session,
		isAuthenticated,
		lastSyncTime,
		login,
		signup,
		logout,
		syncNow,
		restore,
		checkUpdates
	};
});
