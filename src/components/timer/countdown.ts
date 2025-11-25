import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, onUnmounted, readonly, ref, watch } from "vue";
import type { Session } from "../../defines/session.ts";
import {
	add_session,
	delete_latest_session,
	set_newest_session_complete
} from "../../funcs/db/sesssion.ts";
import { get_settings } from "../../funcs/db/settings.ts";

export enum TimerMode {
	FOCUS = 0,
	REST = 1
}

export function useCountdownTimer() {
	const queryClient = useQueryClient();

	const { data: settings, isPending: isLoadingSettings } = useQuery({
		queryKey: ["settings"],
		queryFn: get_settings
	});

	// safely derive durations (in seconds). default to 25/5 if settings missing.
	const focusDuration = computed(() => {
		const val = settings.value?.find((s) => s.key === "Focus Duration")?.value;
		return val ? Number(val) * 60 : 25 * 60;
	});

	const restDuration = computed(() => {
		const val = settings.value?.find(
			(s) => s.key === "Short Break Time"
		)?.value;
		return val ? Number(val) * 60 : 5 * 60;
	});

	const break_auto_start = computed(() => {
		const val = settings.value?.find(
			(s) => s.key === "Auto Start Break"
		)?.value;
		if (val?.toLowerCase() === "true") {
			return true;
		} else {
			return false;
		}
	});
	const focus_auto_start = computed(() => {
		const val = settings.value?.find(
			(s) => s.key === "Auto Start Focus"
		)?.value;
		if (val?.toLowerCase() === "true") {
			return true;
		} else {
			return false;
		}
	});
	const long_break_interval = computed(() => {
		const val = settings.value?.find(
			(s) => s.key === "Long Break Interval"
		)?.value;
		return val ? Number(val) : 4;
	});
	const long_break_time = computed(() => {
		const val = settings.value?.find((s) => s.key === "Long Break Time")?.value;
		return val ? Number(val) * 60 : 15 * 60;
	});

	const remainingTime = ref(0);
	// how many sessions in a row
	const session_streak = ref(0);
	const mode = ref<TimerMode>(TimerMode.FOCUS);
	const isRunning = ref(false);
	const categoryId = ref<number | null>(null);
	let timerId: number | undefined;

	// initialize timer once settings are loaded
	watch(
		[focusDuration, isLoadingSettings],
		([newDuration, loading]) => {
			if (!loading && !isRunning.value && remainingTime.value === 0) {
				remainingTime.value = newDuration;
			}
		},
		{ immediate: true }
	);

	const { mutate: createSession } = useMutation({
		mutationFn: add_session,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] })
	});

	const { mutate: completeSession } = useMutation({
		mutationFn: set_newest_session_complete,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] })
	});

	const { mutate: deleteSession } = useMutation({
		mutationFn: delete_latest_session,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] })
	});

	const tick = () => {
		if (remainingTime.value > 0) {
			remainingTime.value--;
		} else {
			handleComplete();
		}
	};

	const handleComplete = () => {
		pauseTimer();
		if (mode.value === TimerMode.FOCUS) {
			completeSession(); // Mark DB entry as finished
			session_streak.value = session_streak.value + 1;
			if (session_streak.value === long_break_interval.value) {
				remainingTime.value = long_break_time.value;
				session_streak.value = 0;
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

	const startTimer = () => {
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
				createSession(new_session);
			}
		}

		isRunning.value = true;
		timerId = window.setInterval(tick, 1000);
	};

	const pauseTimer = () => {
		isRunning.value = false;
		clearInterval(timerId);
		timerId = undefined;
	};

	const toggleTimer = () => {
		isRunning.value ? pauseTimer() : startTimer();
	};

	const resetTimer = () => {
		pauseTimer();
		// if we reset a running focus session, delete it from DB
		if (mode.value === TimerMode.FOCUS) {
			deleteSession();
		}
		if (mode.value === TimerMode.FOCUS) {
			remainingTime.value = focusDuration.value;
		} else {
			if (session_streak.value === long_break_interval.value) {
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
			session_streak.value = session_streak.value + 1;
			mode.value = TimerMode.REST;
			if (session_streak.value === long_break_interval.value) {
				remainingTime.value = long_break_time.value;
				session_streak.value = 0;
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

	onUnmounted(() => pauseTimer());

	return {
		// State
		remainingTime: readonly(remainingTime),
		isRunning: readonly(isRunning),
		mode: readonly(mode),
		isReady: computed(() => !isLoadingSettings.value),
		sessionStreak: readonly(session_streak),
		long_break_interval: readonly(long_break_interval),

		// Helpers
		formattedTime,
		percent,
		TimerMode: readonly(TimerMode),

		// Actions
		startTimer,
		pauseTimer,
		toggleTimer,
		resetTimer,
		skip,
		setCategoryId
	};
}
