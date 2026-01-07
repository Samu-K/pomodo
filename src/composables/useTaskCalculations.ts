import { computed } from "vue";
import { useSettingsStore } from "../stores/settings";

export function useTaskCalculations() {
	const settingsStore = useSettingsStore();

	const focusDuration = computed(() => {
		const val = settingsStore.settings.find(
			(s) => s.key === "Focus Duration"
		)?.value;
		return val ? Number(val) : 25;
	});

	const shortBreakTime = computed(() => {
		const val = settingsStore.settings.find(
			(s) => s.key === "Short Break Time"
		)?.value;
		return val ? Number(val) : 5;
	});

	const longBreakTime = computed(() => {
		const val = settingsStore.settings.find(
			(s) => s.key === "Long Break Time"
		)?.value;
		return val ? Number(val) : 15;
	});

	const longBreakInterval = computed(() => {
		const val = settingsStore.settings.find(
			(s) => s.key === "Long Break Interval"
		)?.value;
		return val ? Number(val) : 4;
	});

	const calculateTaskDuration = (cycles: number): number => {
		if (cycles <= 0) return 0;
		if (cycles === 1) return focusDuration.value;

		const totalFocusTime = cycles * focusDuration.value;
		const totalBreaks = cycles - 1;
		const longBreaksCount = Math.floor(cycles / longBreakInterval.value);
		const shortBreaksCount = totalBreaks - longBreaksCount;

		const totalBreakTime =
			shortBreaksCount * shortBreakTime.value +
			longBreaksCount * longBreakTime.value;

		return totalFocusTime + totalBreakTime;
	};

	const formatDuration = (minutes: number): string => {
		const h = Math.floor(minutes / 60);
		const m = Math.round(minutes % 60);
		if (h === 0) return `${m} minutes`;
		if (m === 0) return `${h} hours`;
		return `${h}h ${m}m`;
	};

	return {
		focusDuration,
		shortBreakTime,
		longBreakTime,
		longBreakInterval,
		calculateTaskDuration,
		formatDuration
	};
}
