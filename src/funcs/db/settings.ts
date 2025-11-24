import { invoke } from "@tauri-apps/api/core";
import type { Setting, SettingCategory } from "../../defines/settings.ts";

const get_settings = async () => {
	const settings = await invoke<Setting[]>("settings_get_all_settings");
	if (settings.length > 0) {
		return settings;
	} else {
		return [];
	}
};
const get_settings_categories = async () => {
	const categories = await invoke<SettingCategory[]>(
		"settings_get_setting_categories"
	).catch((err) => {
		console.error(err);
		return [];
	});

	if (categories.length > 0) {
		return categories;
	} else {
		return [];
	}
};

const set_setting_value = async (key: string, new_value: string) => {
	const res = await invoke("settings_set_setting_value", {
		value: new_value,
		key: key
	});
	return res;
};

const get_settings_for_category = async (cat_id: number) => {
	const settings = await invoke<Setting[]>(
		"settings_get_settings_for_category",
		{
			cat_id: cat_id
		}
	);
	if (settings.length > 0) {
		return settings;
	} else {
		return [];
	}
};

export {
	get_settings,
	get_settings_categories,
	set_setting_value,
	get_settings_for_category
};
