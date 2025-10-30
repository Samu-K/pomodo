import { computed, onUnmounted, readonly, ref } from "vue";

export function useCountdownTimer(
	initialTime: number,
	initialRestTime: number
) {
	// Use ref for primitive values that need to be reactive
	const initialTimeRef = ref(initialTime);
	const remainingTime = ref(initialTimeRef.value);
	const isRunning = ref(false);
	const mode = ref("focus");

	// Private timer ID
	let timerId: number | undefined;

	const setInitialTime = (time: number) => {
		initialTimeRef.value = time;
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

	const tick = () => {
		if (remainingTime.value > 0) {
			remainingTime.value--;
		} else {
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
		}
	};

	const startTimer = () => {
		if (remainingTime.value === 0) {
			remainingTime.value = initialTimeRef.value;
		}
		if (!isRunning.value && remainingTime.value > 0) {
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
		remainingTime.value = initialTimeRef.value;
	};

	// Clean up the interval when the component unmounts
	onUnmounted(() => {
		pauseTimer();
	});

	return {
		remainingTime: readonly(remainingTime),
		isRunning: readonly(isRunning),
		mode,
		formattedTime,
		percent,
		startTimer,
		pauseTimer,
		toggleTimer,
		resetTimer
	};
}
