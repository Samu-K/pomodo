import { defineStore } from "pinia";
import { ref } from "vue";
import type { Setting, SettingCategory } from "../defines/settings";
import {
	get_settings,
	get_settings_categories,
	set_setting_value
} from "../funcs/db/settings";

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

	return {
		settings,
		categories,
		isLoading,
		fetchSettings,
		updateSetting
	};
});
