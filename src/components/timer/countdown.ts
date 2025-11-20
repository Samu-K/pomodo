import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, onUnmounted, type Ref, readonly, ref, watch } from "vue";
import type { Session } from "../../defines/session.ts";
import {
	add_session,
	delete_latest_session,
	get_sessions,
	set_newest_session_complete
} from "../../funcs/db/sesssion.ts";

export function useCountdownTimer(
	initialFocusTime: number,
	initialRestTime: number
) {
	const queryClient = useQueryClient();

	const sessionsState = useQuery({
		queryKey: ["sessions"],
		queryFn: get_sessions
	});
	const sessions: Ref<Session[] | undefined> = sessionsState.data;

	const addSessionState = useMutation({
		mutationFn: async (session: Session) => await add_session(session),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["sessions"] });
		}
	});
	const deleteSessionState = useMutation({
		mutationFn: delete_latest_session,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["sessions"] });
		}
	});
	const setSessionCompleteState = useMutation({
		mutationFn: set_newest_session_complete,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["sessions"] });
		}
	});

	const initialTimeRef = ref(initialFocusTime);
	const remainingTime = ref(initialTimeRef.value);
	const isRunning = ref(false);
	let category_id: number | undefined;
	enum TIMER_MODES {
		FOCUS = 0,
		REST = 1
	}

	const mode = ref(TIMER_MODES.FOCUS);

	// Private timer ID
	let timerId: number | undefined;

	const setInitialTime = (time: number) => {
		initialTimeRef.value = time;
	};

	const setCategoryId = (cat_id: number | undefined) => {
		category_id = cat_id;
	};

	const formattedTime = computed(() => {
		const time = remainingTime.value < 0 ? 0 : remainingTime.value;

		const hours = Math.floor(time / 3600);
		const minutes = Math.floor((time % 3600) / 60);
		const seconds = time % 60;

		const pad = (num: number) => num.toString().padStart(2, "0");

		if (hours > 0) {
			return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
		} else {
			return `${pad(minutes)}:${pad(seconds)}`;
		}
	});

	const percent = computed(() => {
		return Number((remainingTime.value / initialTimeRef.value) * 100);
	});

	const skip = () => {
		pauseTimer();
		if (mode.value === TIMER_MODES.FOCUS) {
			setInitialTime(initialRestTime);
			mode.value = TIMER_MODES.REST;
			remainingTime.value = initialTimeRef.value;
		} else {
			setInitialTime(initialFocusTime);
			mode.value = TIMER_MODES.FOCUS;
			remainingTime.value = initialTimeRef.value;
		}
	};

	watch(remainingTime, (newTime: number) => {
		if (newTime === 0) {
			pauseTimer();
			if (mode.value === TIMER_MODES.FOCUS) {
				setSessionCompleteState.mutate();

				setInitialTime(initialRestTime);
				mode.value = TIMER_MODES.REST;
				remainingTime.value = initialTimeRef.value;
			} else {
				setInitialTime(initialFocusTime);
				mode.value = TIMER_MODES.FOCUS;
				remainingTime.value = initialTimeRef.value;
			}
		}
	});

	const tick = () => {
		if (remainingTime.value > 0) {
			remainingTime.value--;
		} else {
			pauseTimer();
		}
	};

	const startTimer = () => {
		if (remainingTime.value === 0) {
			remainingTime.value = initialTimeRef.value;
		}
		if (!isRunning.value && remainingTime.value > 0) {
			if (
				remainingTime.value === initialTimeRef.value &&
				mode.value === TIMER_MODES.FOCUS
			) {
				if (category_id === undefined) {
					return;
				}
				const new_session: Session = {
					id: null,
					start_time: new Date().toISOString().slice(0, 19),
					duration: initialTimeRef.value,
					finished: false,
					category_id: category_id ? category_id : null,
					notes: null,
					created_at: null,
					last_modified: null
				};
				addSessionState.mutate(new_session);
			}

			isRunning.value = true;
			timerId = window.setInterval(tick, 1000);
		}
	};

	const pauseTimer = () => {
		isRunning.value = false;
		if (timerId) {
			clearInterval(timerId);
			timerId = undefined;
		}
	};

	const toggleTimer = () => {
		if (isRunning.value) {
			pauseTimer();
		} else {
			startTimer();
		}
	};

	const resetTimer = () => {
		pauseTimer();
		if (mode.value === TIMER_MODES.FOCUS) {
			deleteSessionState.mutate();
		}
		remainingTime.value = initialTimeRef.value;
	};

	// Clean up the interval when the component unmounts
	onUnmounted(() => {
		pauseTimer();
	});

	return {
		remainingTime: readonly(remainingTime),
		isRunning: readonly(isRunning),
		TIMER_MODES: readonly(TIMER_MODES),
		sessions: readonly(sessions),
		mode,
		formattedTime,
		percent,
		startTimer,
		pauseTimer,
		toggleTimer,
		resetTimer,
		skip,
		setCategoryId
	};
}
