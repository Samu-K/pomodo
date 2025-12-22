import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Setting, SettingCategory } from "../funcs/commands";
import {
	get_settings,
	get_settings_categories,
	set_setting_value
} from "../funcs/db/settings";

const THEME_STORAGE_KEY = "pomodo-theme";

export const useSettingsStore = defineStore("settings", () => {
	const settings = ref<Setting[]>([]);
	const categories = ref<SettingCategory[]>([]);

	const isLoading = ref(false);

	const fetchSettings = async () => {
		isLoading.value = true;
		try {
			const [fetchedSettings, fetchedCategories] = await Promise.all([
				get_settings(),
				get_settings_categories()
			]);
			settings.value = fetchedSettings;
			categories.value = fetchedCategories;
		} finally {
			isLoading.value = false;
		}
	};

	const updateSetting = async (
		id: number,
		value: string | number | boolean
	) => {
		let stringValue = "";
		if (typeof value === "boolean") {
			stringValue = value ? "true" : "false";
		} else {
			stringValue = String(value);
		}

		// Optimistic update
		const settingIndex = settings.value.findIndex((s) => s.id === id);
		if (settingIndex !== -1) {
			settings.value[settingIndex].value = stringValue;
		}

		await set_setting_value(id, stringValue);
	};

	// Theme-specific computed properties
	const themeSetting = computed(() =>
		settings.value.find((s) => s.key === "Theme")
	);

	const theme = computed(() => {
		const value = themeSetting.value?.value || "dark";
		return value as "light" | "dark" | "system";
	});

	/**
	 * Get the system's preferred color scheme
	 */
	const getSystemTheme = (): "light" | "dark" => {
		if (typeof window !== "undefined" && window.matchMedia) {
			return window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light";
		}
		return "dark"; // Default to dark if can't detect
	};

	/**
	 * Get the resolved theme (resolve "system" to actual light/dark)
	 */
	const resolvedTheme = computed((): "light" | "dark" => {
		if (theme.value === "system") {
			return getSystemTheme();
		}
		return theme.value;
	});

	/**
	 * Set theme and update database
	 */
	const setTheme = async (newTheme: "light" | "dark" | "system") => {
		const setting = themeSetting.value;
		if (setting) {
			await updateSetting(setting.id, newTheme);
			applyTheme(newTheme);
		}
	};

	/**
	 * Apply theme to DOM by toggling dark class on html element
	 */
	const applyTheme = (themeValue: "light" | "dark" | "system") => {
		// Resolve "system" to actual theme
		const effectiveTheme =
			themeValue === "system" ? getSystemTheme() : themeValue;

		if (effectiveTheme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	};

	/**
	 * Initialize theme - migrate from localStorage if needed, then apply to DOM
	 * Also set up system theme change listener
	 */
	const initTheme = async () => {
		// One-time migration from localStorage
		const localStorageTheme = localStorage.getItem(THEME_STORAGE_KEY) as
			| "light"
			| "dark"
			| "system"
			| null;

		if (localStorageTheme && themeSetting.value) {
			// Migrate to database
			await setTheme(localStorageTheme);
			// Clear localStorage
			localStorage.removeItem(THEME_STORAGE_KEY);
		} else {
			// Just apply current theme
			applyTheme(theme.value);
		}

		// Listen for system theme changes if using system theme
		if (typeof window !== "undefined" && window.matchMedia) {
			window
				.matchMedia("(prefers-color-scheme: dark)")
				.addEventListener("change", () => {
					if (theme.value === "system") {
						applyTheme("system");
					}
				});
		}
	};

	return {
		settings,
		categories,
		isLoading,
		fetchSettings,
		updateSetting,
		// Theme
		theme,
		resolvedTheme,
		themeSetting,
		setTheme,
		initTheme,
		applyTheme
	};
});
