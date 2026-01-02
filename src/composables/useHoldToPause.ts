import { ref } from "vue";

export function useHoldToPause(
	onComplete: () => void,
	duration = 3000,
	updateInterval = 50
) {
	const holdProgress = ref(0);
	let holdInterval: number | undefined;

	const startHold = () => {
		holdProgress.value = 0;
		holdInterval = window.setInterval(() => {
			holdProgress.value += (updateInterval / duration) * 100;

			if (holdProgress.value >= 100) {
				completeHold();
			}
		}, updateInterval);
	};

	const endHold = () => {
		if (holdInterval) {
			clearInterval(holdInterval);
			holdInterval = undefined;
		}
		holdProgress.value = 0;
	};

	const completeHold = () => {
		endHold();
		onComplete();
	};

	return {
		holdProgress,
		startHold,
		endHold
	};
}
