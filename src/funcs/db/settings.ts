import { commands } from "../commands";

const get_settings = async () => {
	const res = await commands.settingsGetAllSettings();
	if (res.status === "error") throw new Error(res.error.message);
	return res.data || [];
};
const get_settings_categories = async () => {
	const res = await commands.settingsGetSettingCategories();
	if (res.status === "error") throw new Error(res.error.message);
	return res.data || [];
};

const set_setting_value = async (stt_id: number, new_value: string) => {
	const res = await commands.settingsSetSettingValue(new_value, stt_id);
	if (res.status === "error") throw new Error(res.error.message);
	return res.data;
};

const get_settings_for_category = async (cat_id: number) => {
	const res = await commands.settingsGetSettingsForCategory(cat_id);
	if (res.status === "error") throw new Error(res.error.message);
	return res.data || [];
};

export {
	get_settings,
	get_settings_categories,
	set_setting_value,
	get_settings_for_category
};
