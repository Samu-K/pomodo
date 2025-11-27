import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import type { Session } from "../funcs/commands";
import {
	add_session,
	delete_latest_session,
	set_newest_session_complete
} from "../funcs/db/session";
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
			} else {
				remainingTime.value = restDuration.value;
			}
		} else {
			if (sessionStreak.value >= long_break_interval.value) {
				sessionStreak.value = 0;
			}
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
