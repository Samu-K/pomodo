import { invoke } from "@tauri-apps/api/core";
import type { Setting, SettingCategory } from "../../defines/settings.ts";

const get_settings = async () => {
	const settings = await invoke<Setting[]>("settings_get_all_settings");
	return settings || [];
};
const get_settings_categories = async () => {
	const categories = await invoke<SettingCategory[]>(
		"settings_get_setting_categories"
	);
	return categories || [];
};

const set_setting_value = async (stt_id: number, new_value: string) => {
	const res = await invoke("settings_set_setting_value", {
		value: new_value,
		id: stt_id
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
	return settings || [];
};

export {
	get_settings,
	get_settings_categories,
	set_setting_value,
	get_settings_for_category
};
