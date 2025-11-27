import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Setting, SettingCategory } from "@/defines/settings";
import {
	get_settings,
	get_settings_categories,
	get_settings_for_category,
	set_setting_value
} from "../settings";

// Mock the invoke function from tauri
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn()
}));

describe("Settings DB Functions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("get_settings returns settings when they exist", async () => {
		const mockSettings: Setting[] = [
			{
				id: 1,
				key: "theme",
				description: "App theme",
				value: "dark",
				category_id: 1,
				data_type: "string"
			}
		];

		vi.mocked(invoke).mockResolvedValue(mockSettings);

		const result = await get_settings();

		expect(invoke).toHaveBeenCalledWith("settings_get_all_settings");
		expect(result).toEqual(mockSettings);
	});

	it("get_settings returns empty array when no settings found", async () => {
		vi.mocked(invoke).mockResolvedValue([]);

		const result = await get_settings();

		expect(invoke).toHaveBeenCalledWith("settings_get_all_settings");
		expect(result).toEqual([]);
	});

	it("get_settings_categories returns categories when they exist", async () => {
		const mockCategories: SettingCategory[] = [{ id: 1, name: "General" }];

		vi.mocked(invoke).mockResolvedValue(mockCategories);

		const result = await get_settings_categories();

		expect(invoke).toHaveBeenCalledWith("settings_get_setting_categories");
		expect(result).toEqual(mockCategories);
	});

	it("get_settings_categories throws error on failure", async () => {
		vi.mocked(invoke).mockRejectedValue(new Error("DB Error"));

		await expect(get_settings_categories()).rejects.toThrow("DB Error");
	});

	it("set_setting_value calls invoke with correct arguments", async () => {
		const settingId = 1;
		const newValue = "light";
		vi.mocked(invoke).mockResolvedValue(undefined);

		await set_setting_value(settingId, newValue);

		expect(invoke).toHaveBeenCalledWith("settings_set_setting_value", {
			value: newValue,
			id: settingId
		});
	});

	it("set_setting_value throws error on failure", async () => {
		const settingId = 1;
		const newValue = "light";
		vi.mocked(invoke).mockRejectedValue(new Error("Update failed"));

		await expect(set_setting_value(settingId, newValue)).rejects.toThrow(
			"Update failed"
		);
	});

	it("get_settings_for_category returns settings when they exist", async () => {
		const catId = 1;
		const mockSettings: Setting[] = [
			{
				id: 1,
				key: "theme",
				description: "App theme",
				value: "dark",
				category_id: 1,
				data_type: "string"
			}
		];

		vi.mocked(invoke).mockResolvedValue(mockSettings);

		const result = await get_settings_for_category(catId);

		expect(invoke).toHaveBeenCalledWith("settings_get_settings_for_category", {
			cat_id: catId
		});
		expect(result).toEqual(mockSettings);
	});

	it("get_settings_for_category returns empty array when no settings found", async () => {
		const catId = 1;
		vi.mocked(invoke).mockResolvedValue([]);

		const result = await get_settings_for_category(catId);

		expect(invoke).toHaveBeenCalledWith("settings_get_settings_for_category", {
			cat_id: catId
		});
		expect(result).toEqual([]);
	});
});
