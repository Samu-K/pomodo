import { computed, onUnmounted, type Ref, readonly, ref } from "vue";
import type { Session } from "../../defines/session.ts";
import { add_session } from "../../funcs/db/session.ts";
import { invoke } from "@tauri-apps/api/core";

export function useCountdownTimer(
	initialTime: number,
	initialRestTime: number
) {
	// Use ref for primitive values that need to be reactive
	const initialTimeRef = ref(initialTime);
	const remainingTime = ref(initialTimeRef.value);
	const isRunning = ref(false);
	let category_id: number | undefined;

	const mode = ref("focus");
	const sessions: Ref<Array<Session>> = ref([]);

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
		if (mode.value === "focus") {
			setInitialTime(initialRestTime);
			mode.value = "rest";
			remainingTime.value = initialTimeRef.value;
		} else {
			setInitialTime(initialTime);
			mode.value = "focus";
			remainingTime.value = initialTimeRef.value;
		}
	};

	const tick = () => {
		if (remainingTime.value > 0) {
			remainingTime.value--;
		} else {
			pauseTimer();
			if (mode.value === "focus") {
				sessions.value[sessions.value.length - 1].finished = true;

				setInitialTime(initialRestTime);
				mode.value = "rest";
				remainingTime.value = initialTimeRef.value;
			} else {
				setInitialTime(initialTime);
				mode.value = "focus";
				remainingTime.value = initialTimeRef.value;
			}
		}
	};

	const startTimer = () => {
		if (remainingTime.value === 0) {
			remainingTime.value = initialTimeRef.value;
		}
		if (!isRunning.value && remainingTime.value > 0) {
			if (
				remainingTime.value === initialTimeRef.value &&
				mode.value === "focus"
			) {
				let id = 1;
				if (sessions.value.length > 0) {
					id = sessions.value[sessions.value.length - 1].id + 1;
				}
				if (category_id === undefined) {
					return;
				}
				const new_session: Session = {
					id: id,
					start_time: new Date().toISOString(),
					duration: initialTimeRef.value,
					finished: false,
					category_id: category_id ? category_id : -99,
					notes: null,
					created_at: null,
					last_modified: null
				};
				console.log(new_session);
				invoke("session_add_session", { session: new_session });
				sessions.value.push(new_session);
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
		if (sessions.value.length > 0 && mode.value === "focus") {
			sessions.value.pop();
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
