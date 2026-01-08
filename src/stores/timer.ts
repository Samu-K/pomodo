import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useTimerFeedback } from "../composables/useTimerFeedback";
import type { Session } from "../funcs/commands";
import {
	add_session,
	delete_session,
	set_newest_session_complete
} from "../funcs/db/session";
import { toUTCISOString } from "../funcs/stats/date_handling";
import { useSettingsStore } from "./settings";
import { useUIStore } from "./ui";

export enum TimerMode {
	FOCUS = 0,
	REST = 1
}

export const useTimerStore = defineStore("timer", () => {
	const settingsStore = useSettingsStore();
	const ui = useUIStore();

	// --- Settings & Computed Durations ---
	// Ensure settings are loaded
	if (settingsStore.settings.length === 0) {
		settingsStore.fetchSettings();
	}

	const focusDuration = computed(() => {
		if (import.meta.env.VITE_DEV_MODE === "true") {
			return 10;
		}
		const val = settingsStore.settings.find(
			(s) => s.key === "Focus Duration"
		)?.value;
		return val ? Number(val) * 60 : 25 * 60;
	});

	const restDuration = computed(() => {
		if (import.meta.env.VITE_DEV_MODE === "true") {
			return 5;
		}
		const val = settingsStore.settings.find(
			(s) => s.key === "Short Break Time"
		)?.value;
		return val ? Number(val) * 60 : 5 * 60;
	});

	const break_auto_start = computed(() => {
		const val = settingsStore.settings.find(
			(s) => s.key === "Auto Start Break"
		)?.value;
		return val?.toLowerCase() === "true";
	});

	const focus_auto_start = computed(() => {
		const val = settingsStore.settings.find(
			(s) => s.key === "Auto Start Focus"
		)?.value;
		return val?.toLowerCase() === "true";
	});

	const long_break_interval = computed(() => {
		const val = settingsStore.settings.find(
			(s) => s.key === "Long Break Interval"
		)?.value;
		return val ? Number(val) : 4;
	});

	const long_break_time = computed(() => {
		const val = settingsStore.settings.find(
			(s) => s.key === "Long Break Time"
		)?.value;
		return val ? Number(val) * 60 : 15 * 60;
	});

	// --- State ---
	const remainingTime = ref(0);
	const sessionStreak = ref(0);
	const mode = ref<TimerMode>(TimerMode.FOCUS);
	const isRunning = ref(false);
	const categoryId = ref<number | null>(null);
	const taskId = ref<number | null>(null);
	const projectId = ref<number | null>(null);
	const currentSessionId = ref<number | null>(null);
	let endTime: number | undefined;

	// --- Worker ---
	const worker = new Worker(
		new URL("../workers/timer.worker.ts", import.meta.url),
		{
			type: "module"
		}
	);

	worker.onmessage = (e) => {
		const { type, payload } = e.data;
		if (type === "TICK") {
			remainingTime.value = payload.remainingTime;
		} else if (type === "COMPLETE") {
			remainingTime.value = 0;
			handleComplete();
		}
	};

	// --- Initialization ---
	// Initialize timer when settings are loaded and timer is fresh
	watch(
		[
			focusDuration,
			restDuration,
			long_break_time,
			() => settingsStore.isLoading
		],
		([newFocus, newRest, newLongBreak, loading]) => {
			if (!loading && !isRunning.value) {
				// If timer is at the "start" of a session type (full duration), update it to the new duration
				// This handles cases where user changes settings while timer is reset
				if (mode.value === TimerMode.FOCUS) {
					remainingTime.value = newFocus;
				} else if (mode.value === TimerMode.REST) {
					// Check if we are in long break or short break
					if (sessionStreak.value === long_break_interval.value) {
						remainingTime.value = newLongBreak;
					} else {
						remainingTime.value = newRest;
					}
				}
			}
		},
		{ immediate: true }
	);

	// --- Actions ---

	const handleComplete = async () => {
		pauseTimer();

		// Check for notifications
		const { triggerAllFeedback } = useTimerFeedback();
		await triggerAllFeedback(mode.value === TimerMode.FOCUS);

		if (mode.value === TimerMode.FOCUS) {
			try {
				await set_newest_session_complete(); // Mark DB entry as finished
			} catch (e) {
				console.error("Error marking session complete:", e);
				let msg = "Failed to complete session";
				if (e instanceof Error) msg = e.message;
				ui.setError(msg);
			}
			currentSessionId.value = null; // Session is complete, don't delete on reset
			sessionStreak.value = sessionStreak.value + 1;
			if (sessionStreak.value === long_break_interval.value) {
				remainingTime.value = long_break_time.value;
			} else {
				remainingTime.value = restDuration.value;
			}
			mode.value = TimerMode.REST;
			if (break_auto_start.value) {
				startTimer();
			}
		} else {
			if (sessionStreak.value >= long_break_interval.value) {
				sessionStreak.value = 0;
			}
			mode.value = TimerMode.FOCUS;
			remainingTime.value = focusDuration.value;
			if (focus_auto_start.value) {
				startTimer();
			}
		}
	};

	const startTimer = async () => {
		if (isRunning.value) return;

		// if starting a fresh Focus session, create DB entry
		const currentMax =
			mode.value === TimerMode.FOCUS ? focusDuration.value : restDuration.value;

		if (remainingTime.value === currentMax && mode.value === TimerMode.FOCUS) {
			if (categoryId.value !== null && categoryId.value !== undefined) {
				const new_session: Session = {
					id: null,
					start_time: toUTCISOString(new Date()),
					duration: focusDuration.value,
					finished: false,
					category_id: categoryId.value,
					task_id: taskId.value, // Include task ID
					project_id: projectId.value, // Include project ID
					notes: null,
					created_at: null,
					last_modified: null
				};
				try {
					const newId = await add_session(new_session);
					currentSessionId.value = newId;
				} catch (e) {
					console.error("Error creating session:", e);
					let msg = "Failed to create focus session";
					if (e instanceof Error) msg = e.message;
					ui.setError(msg);
				}
			}
		}

		// Calculate end time based on current remaining time
		endTime = Date.now() + remainingTime.value * 1000;

		isRunning.value = true;
		worker.postMessage({ type: "START", payload: { endTime } });
	};

	const pauseTimer = async () => {
		isRunning.value = false;
		worker.postMessage({ type: "PAUSE" });
		endTime = undefined;
	};

	const toggleTimer = () => {
		isRunning.value ? pauseTimer() : startTimer();
	};

	const resetTimer = async () => {
		await pauseTimer();
		// if we reset a running focus session, delete it from DB
		if (mode.value === TimerMode.FOCUS) {
			if (currentSessionId.value) {
				try {
					console.log(
						`Attempting to delete session ID: ${currentSessionId.value}`
					);
					await delete_session(currentSessionId.value);
					console.log(
						`Successfully deleted session ID: ${currentSessionId.value}`
					);
				} catch (e) {
					console.error(
						`Failed to delete session ${currentSessionId.value}:`,
						e
					);
					let msg = "Failed to delete session";
					if (e instanceof Error) msg = e.message;
					ui.setError(msg);
					// Continue with reset even if deletion fails
				} finally {
					currentSessionId.value = null;
				}
			}
		}
		if (mode.value === TimerMode.FOCUS) {
			remainingTime.value = focusDuration.value;
		} else {
			if (sessionStreak.value === long_break_interval.value) {
				remainingTime.value = long_break_time.value;
			} else {
				remainingTime.value = restDuration.value;
			}
		}
	};

	const skip = () => {
		pauseTimer();
		// switch modes immediately
		if (mode.value === TimerMode.FOCUS) {
			// Clear the session ID since we're abandoning this session
			currentSessionId.value = null;
			sessionStreak.value = sessionStreak.value + 1;
			mode.value = TimerMode.REST;
			if (sessionStreak.value === long_break_interval.value) {
				remainingTime.value = long_break_time.value;
			} else {
				remainingTime.value = restDuration.value;
			}
		} else {
			if (sessionStreak.value >= long_break_interval.value) {
				sessionStreak.value = 0;
			}
			mode.value = TimerMode.FOCUS;
			remainingTime.value = focusDuration.value;
			if (focus_auto_start.value) {
				startTimer();
			}
		}
	};

	const setCategoryId = (id: number | null | undefined) => {
		categoryId.value = id ?? null;
	};

	const setTaskId = (id: number | null) => {
		taskId.value = id;
	};

	const setProjectId = (id: number | null) => {
		projectId.value = id;
	};

	// --- Helpers ---
	const formattedTime = computed(() => {
		const time = remainingTime.value < 0 ? 0 : remainingTime.value;
		const hours = Math.floor(time / 3600);
		const minutes = Math.floor((time % 3600) / 60);
		const seconds = time % 60;
		const pad = (n: number) => n.toString().padStart(2, "0");

		return hours > 0
			? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
			: `${pad(minutes)}:${pad(seconds)}`;
	});

	const percent = computed(() => {
		const total =
			mode.value === TimerMode.FOCUS ? focusDuration.value : restDuration.value;
		if (total === 0) return 0;
		return Number((remainingTime.value / total) * 100);
	});

	const isReady = computed(() => !settingsStore.isLoading);

	return {
		// State
		remainingTime,
		isRunning,
		mode,
		sessionStreak,
		categoryId,
		taskId,
		projectId,
		long_break_interval,
		isReady,

		// Helpers
		formattedTime,
		percent,

		// Actions
		startTimer,
		pauseTimer,
		toggleTimer,
		resetTimer,
		skip,
		setCategoryId,
		setTaskId,
		setProjectId
	};
});
