import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import type { Session } from "../defines/session";
import {
	add_session,
	delete_latest_session,
	set_newest_session_complete
} from "../funcs/db/sesssion";
import { useSettingsStore } from "./settings";

export enum TimerMode {
	FOCUS = 0,
	REST = 1
}

export const useTimerStore = defineStore("timer", () => {
	const settingsStore = useSettingsStore();

	// --- Settings & Computed Durations ---
	// Ensure settings are loaded
	if (settingsStore.settings.length === 0) {
		settingsStore.fetchSettings();
	}

	const focusDuration = computed(() => {
		const val = settingsStore.settings.find(
			(s) => s.key === "Focus Duration"
		)?.value;
		return val ? Number(val) * 60 : 25 * 60;
	});

	const restDuration = computed(() => {
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
	let timerId: number | undefined;
	let endTime: number | undefined;

	// --- Initialization ---
	// Initialize timer when settings are loaded and timer is fresh
	watch(
		[focusDuration, restDuration, long_break_time, () => settingsStore.isLoading],
		([newFocus, newRest, newLongBreak, loading]) => {
			if (!loading && !isRunning.value) {
				// If timer is at the "start" of a session type (full duration), update it to the new duration
				// This handles cases where user changes settings while timer is reset
				if (mode.value === TimerMode.FOCUS) {
					// Check if it was equal to the OLD focus duration? 
					// Actually, simpler logic: if not running, and we are in a "fresh" state or user wants updates
					// Let's assume if it's paused and equals the OLD duration, we update.
					// But we don't have the old duration easily. 
					// Safe bet: if !isRunning, we can update if it looks like it was reset.
					// Or just force update if it matches the *current* duration (which it won't if it changed).

					// Better logic:
					// If the timer is NOT running, we should probably update the display to the new time 
					// IF the user hasn't partially completed a session.
					// How to know if partially completed? 
					// We can check if remainingTime equals the *previous* default. 
					// But we don't track previous.

					// Let's just update it if it seems to be in a "reset" state (percent 100 or 0 depending on how you look at it, but here remainingTime is what matters).
					// Actually, the original code only checked `remainingTime.value === 0`.
					// We want to update it if it's currently set to a full duration of *some* kind, or just always if not running?
					// Always updating if not running might be annoying if you paused at 10:00 of 25:00 and changed settings to 30:00.
					// But if you paused at 25:00 (start), it should update to 30:00.

					// Let's try: if remainingTime equals the *current* value of the *other* settings, or if it was just initialized.
					// Actually, let's just stick to: if it's not running, and we are at the start.

					// The issue described was "doesn't always update... if it's already initialized".
					// Original code: `if (!loading && !isRunning.value && remainingTime.value === 0)`
					// This only updates if it's 0. But usually it's 25*60.

					// Fix:
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

	const tick = () => {
		if (!endTime) return;

		const now = Date.now();
		const diff = Math.ceil((endTime - now) / 1000);

		if (diff > 0) {
			remainingTime.value = diff;
		} else {
			remainingTime.value = 0;
			handleComplete();
		}
	};

	const handleComplete = async () => {
		pauseTimer();
		if (mode.value === TimerMode.FOCUS) {
			await set_newest_session_complete(); // Mark DB entry as finished
			sessionStreak.value = sessionStreak.value + 1;
			if (sessionStreak.value === long_break_interval.value) {
				remainingTime.value = long_break_time.value;
				sessionStreak.value = 0;
			} else {
				remainingTime.value = restDuration.value;
			}
			mode.value = TimerMode.REST;
			if (break_auto_start.value) {
				startTimer();
			}
		} else {
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
					start_time: new Date().toISOString().slice(0, 19),
					duration: focusDuration.value,
					finished: false,
					category_id: categoryId.value,
					notes: null,
					created_at: null,
					last_modified: null
				};
				await add_session(new_session);
			}
		}

		// Calculate end time based on current remaining time
		endTime = Date.now() + remainingTime.value * 1000;

		isRunning.value = true;
		timerId = window.setInterval(tick, 100); // Check more frequently for smoothness
	};

	const pauseTimer = () => {
		isRunning.value = false;
		clearInterval(timerId);
		timerId = undefined;
		endTime = undefined;
	};

	const toggleTimer = () => {
		isRunning.value ? pauseTimer() : startTimer();
	};

	const resetTimer = async () => {
		pauseTimer();
		// if we reset a running focus session, delete it from DB
		if (mode.value === TimerMode.FOCUS) {
			await delete_latest_session();
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
			sessionStreak.value = sessionStreak.value + 1;
			mode.value = TimerMode.REST;
			if (sessionStreak.value === long_break_interval.value) {
				remainingTime.value = long_break_time.value;
				sessionStreak.value = 0;
			} else {
				remainingTime.value = restDuration.value;
			}
		} else {
			mode.value = TimerMode.FOCUS;
			remainingTime.value = focusDuration.value;
		}
	};

	const setCategoryId = (id: number | null | undefined) => {
		categoryId.value = id ?? null;
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
		setCategoryId
	};
});
