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
import { useTimerSettings } from "./timer/useTimerSettings";
import { useUIStore } from "./ui";

export enum TimerMode {
	FOCUS = 0,
	REST = 1
}
const NOTIFICATION_BUFFER_MS = 500;

export const useTimerStore = defineStore("timer", () => {
	const settingsStore = useSettingsStore();
	const ui = useUIStore();
	const {
		focusDuration,
		restDuration,
		breakAutoStart,
		focusAutoStart,
		longBreakInterval,
		longBreakTime
	} = useTimerSettings();

	const remainingTime = ref(0);
	const sessionStreak = ref(0);
	const mode = ref<TimerMode>(TimerMode.FOCUS);
	const isRunning = ref(false);
	const categoryId = ref<number | null>(null);
	const taskId = ref<number | null>(null);
	const projectId = ref<number | null>(null);
	const currentSessionId = ref<number | null>(null);
	let endTime: number | undefined;

	const worker = new Worker(
		new URL("../workers/timer.worker.ts", import.meta.url),
		{ type: "module" }
	);
	worker.onmessage = (e) => {
		const { type, payload } = e.data;
		if (type === "TICK") remainingTime.value = payload.remainingTime;
		else if (type === "COMPLETE") {
			remainingTime.value = 0;
			handleComplete();
		}
	};

	watch(
		[focusDuration, restDuration, longBreakTime, () => settingsStore.isLoading],
		([nf, nr, nl, loading]) => {
			if (!loading && !isRunning.value) {
				if (mode.value === TimerMode.FOCUS) remainingTime.value = nf;
				else
					remainingTime.value =
						sessionStreak.value === longBreakInterval.value ? nl : nr;
			}
		},
		{ immediate: true }
	);

	const handleComplete = async () => {
		pauseTimer();
		const { triggerAllFeedback, cancelScheduledNotification } =
			useTimerFeedback();
		await cancelScheduledNotification();
		await triggerAllFeedback(mode.value === TimerMode.FOCUS);

		if (mode.value === TimerMode.FOCUS) {
			try {
				await set_newest_session_complete();
			} catch (e) {
				ui.setError(
					e instanceof Error ? e.message : "Failed to complete session"
				);
			}
			currentSessionId.value = null;
			sessionStreak.value++;
			remainingTime.value =
				sessionStreak.value === longBreakInterval.value
					? longBreakTime.value
					: restDuration.value;
			mode.value = TimerMode.REST;
			if (breakAutoStart.value) startTimer();
		} else {
			if (sessionStreak.value >= longBreakInterval.value)
				sessionStreak.value = 0;
			mode.value = TimerMode.FOCUS;
			remainingTime.value = focusDuration.value;
			if (focusAutoStart.value) startTimer();
		}
	};

	const startTimer = async () => {
		if (isRunning.value) return;
		if (
			remainingTime.value ===
				(mode.value === TimerMode.FOCUS
					? focusDuration.value
					: restDuration.value) &&
			mode.value === TimerMode.FOCUS
		) {
			if (categoryId.value != null) {
				const sess: Session = {
					id: null,
					start_time: toUTCISOString(new Date()),
					duration: focusDuration.value,
					finished: false,
					category_id: categoryId.value,
					task_id: taskId.value,
					project_id: projectId.value,
					notes: null,
					created_at: null,
					last_modified: null
				};
				try {
					currentSessionId.value = await add_session(sess);
				} catch (e) {
					ui.setError(
						e instanceof Error ? e.message : "Failed to create session"
					);
				}
			}
		}
		endTime = Date.now() + remainingTime.value * 1000;
		const { scheduleFinishedNotification } = useTimerFeedback();
		scheduleFinishedNotification(
			mode.value === TimerMode.FOCUS,
			remainingTime.value * 1000 + NOTIFICATION_BUFFER_MS
		);
		isRunning.value = true;
		worker.postMessage({ type: "START", payload: { endTime } });
	};

	const pauseTimer = async () => {
		isRunning.value = false;
		worker.postMessage({ type: "PAUSE" });
		endTime = undefined;
		await useTimerFeedback().cancelScheduledNotification();
	};

	const resetTimer = async () => {
		await pauseTimer();
		if (mode.value === TimerMode.FOCUS && currentSessionId.value) {
			try {
				await delete_session(currentSessionId.value);
			} catch (e) {
				ui.setError(
					e instanceof Error ? e.message : "Failed to delete session"
				);
			} finally {
				currentSessionId.value = null;
			}
		}
		if (mode.value === TimerMode.FOCUS)
			remainingTime.value = focusDuration.value;
		else
			remainingTime.value =
				sessionStreak.value === longBreakInterval.value
					? longBreakTime.value
					: restDuration.value;
	};

	const skip = async () => {
		await pauseTimer();
		if (mode.value === TimerMode.FOCUS) {
			currentSessionId.value = null;
			sessionStreak.value++;
			mode.value = TimerMode.REST;
			remainingTime.value =
				sessionStreak.value === longBreakInterval.value
					? longBreakTime.value
					: restDuration.value;
		} else {
			if (sessionStreak.value >= longBreakInterval.value)
				sessionStreak.value = 0;
			mode.value = TimerMode.FOCUS;
			remainingTime.value = focusDuration.value;
			if (focusAutoStart.value) startTimer();
		}
	};

	const formattedTime = computed(() => {
		const t = Math.max(0, remainingTime.value);
		const h = Math.floor(t / 3600),
			m = Math.floor((t % 3600) / 60),
			s = t % 60;
		const pad = (n: number) => n.toString().padStart(2, "0");
		return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
	});

	const percent = computed(() => {
		const total =
			mode.value === TimerMode.FOCUS ? focusDuration.value : restDuration.value;
		return total === 0 ? 0 : (remainingTime.value / total) * 100;
	});

	return {
		remainingTime,
		isRunning,
		mode,
		sessionStreak,
		categoryId,
		taskId,
		projectId,
		isReady: computed(() => !settingsStore.isLoading),
		formattedTime,
		percent,
		startTimer,
		pauseTimer,
		toggleTimer: () => (isRunning.value ? pauseTimer() : startTimer()),
		resetTimer,
		skip,
		setCategoryId: (id: number | null | undefined) => {
			categoryId.value = id ?? null;
		},
		setTaskId: (id: number | null) => {
			taskId.value = id;
		},
		setProjectId: (id: number | null) => {
			projectId.value = id;
		}
	};
});
