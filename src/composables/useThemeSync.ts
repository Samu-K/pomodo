import { watch } from "vue";
import type { ThemeInstance } from "vuetify";
import { useTheme } from "vuetify";
import { useSettingsStore } from "../stores/settings";
import { useThemeStore } from "../stores/theme";
import { TimerMode, useTimerStore } from "../stores/timer";

export function useThemeSync() {
	const settingsStore = useSettingsStore();
	const themeStore = useThemeStore();
	const vuetifyTheme = useTheme();
	const timer = useTimerStore();

	const applyToVuetify = (theme: string) => {
		const themeWithChange = vuetifyTheme as ThemeInstance & {
			change?: (name: string) => void;
		};
		if (typeof themeWithChange.change === "function") {
			themeWithChange.change(theme);
		} else {
			vuetifyTheme.global.name.value = theme;
		}
	};

	// Apply theme overrides
	watch(
		() => settingsStore.themeOverrides,
		(newOverrides) => {
			if (newOverrides && Object.keys(newOverrides).length > 0) {
				themeStore.applyTheme(newOverrides, vuetifyTheme);
			} else {
				themeStore.resetTheme(vuetifyTheme);
			}
		},
		{ deep: true, immediate: true }
	);

	// Watch settings store theme and sync Vuetify theme
	watch(
		() => settingsStore.resolvedTheme,
		(newTheme) => {
			applyToVuetify(newTheme);
		},
		{ immediate: true }
	);

	// Focus mode class on body
	watch(
		[() => timer.isRunning, () => timer.mode],
		([isRunning, mode]) => {
			if (isRunning && mode === TimerMode.FOCUS) {
				document.body.classList.add("focus-mode");
			} else {
				document.body.classList.remove("focus-mode");
			}
		},
		{ immediate: true }
	);

	return {
		applyToVuetify
	};
}
