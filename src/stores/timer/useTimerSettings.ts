import { computed } from "vue";
import { useSettingsStore } from "../settings";

export function useTimerSettings() {
	const settingsStore = useSettingsStore();

	const focusDuration = computed(() => {
		if (import.meta.env.VITE_DEV_MODE === "true") return 10;
		const val = settingsStore.settings.find(
			(s) => s.key === "Focus Duration"
		)?.value;
		return val ? Number(val) * 60 : 25 * 60;
	});

	const restDuration = computed(() => {
		if (import.meta.env.VITE_DEV_MODE === "true") return 5;
		const val = settingsStore.settings.find(
			(s) => s.key === "Short Break Time"
		)?.value;
		return val ? Number(val) * 60 : 5 * 60;
	});

	const breakAutoStart = computed(() => {
		const val = settingsStore.settings.find(
			(s) => s.key === "Auto Start Break"
		)?.value;
		return val?.toLowerCase() === "true";
	});

	const focusAutoStart = computed(() => {
		const val = settingsStore.settings.find(
			(s) => s.key === "Auto Start Focus"
		)?.value;
		return val?.toLowerCase() === "true";
	});

	const longBreakInterval = computed(() => {
		const val = settingsStore.settings.find(
			(s) => s.key === "Long Break Interval"
		)?.value;
		return val ? Number(val) : 4;
	});

	const longBreakTime = computed(() => {
		const val = settingsStore.settings.find(
			(s) => s.key === "Long Break Time"
		)?.value;
		return val ? Number(val) * 60 : 15 * 60;
	});

	return {
		focusDuration,
		restDuration,
		breakAutoStart,
		focusAutoStart,
		longBreakInterval,
		longBreakTime
	};
}
