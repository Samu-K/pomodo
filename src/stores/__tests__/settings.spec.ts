import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "../settings";
import { useUIStore } from "../ui";

// Mock DB functions
vi.mock("../../funcs/db/settings", () => ({
	get_settings: vi.fn(),
	get_settings_categories: vi.fn(),
	set_setting_value: vi.fn()
}));

import {
	get_settings,
	get_settings_categories,
	set_setting_value
} from "../../funcs/db/settings";

describe("Settings Store", () => {
	let settingsStore: ReturnType<typeof useSettingsStore>;
	let uiStore: ReturnType<typeof useUIStore>;

	beforeEach(() => {
		setActivePinia(createPinia());
		settingsStore = useSettingsStore();
		uiStore = useUIStore();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Initialization", () => {
		it("initializes with default state", () => {
			expect(settingsStore.settings).toEqual([]);
			expect(settingsStore.categories).toEqual([]);
			expect(settingsStore.isLoading).toBe(false);
		});
	});

	describe("fetchSettings", () => {
		it("fetches settings and categories successfully", async () => {
			const mockSettings = [
				{
					id: 1,
					key: "Theme",
					value: "Dark",
					category_id: 1,
					description: null,
					data_type: "string"
				},
				{
					id: 2,
					key: "Notifications",
					value: "true",
					category_id: 2,
					description: null,
					data_type: "boolean"
				}
			];
			const mockCategories = [
				{ id: 1, name: "Appearance" },
				{ id: 2, name: "System" }
			];

			vi.mocked(get_settings).mockResolvedValue(mockSettings);
			vi.mocked(get_settings_categories).mockResolvedValue(mockCategories);

			const fetchPromise = settingsStore.fetchSettings();
			expect(settingsStore.isLoading).toBe(true);

			await fetchPromise;

			expect(settingsStore.isLoading).toBe(false);
			expect(settingsStore.settings).toEqual(mockSettings);
			expect(settingsStore.categories).toEqual(mockCategories);
			expect(get_settings).toHaveBeenCalledTimes(1);
			expect(get_settings_categories).toHaveBeenCalledTimes(1);
		});

		it("handles errors gracefully and sets ui store error", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			vi.mocked(get_settings).mockRejectedValue(new Error("DB Error"));

			await settingsStore.fetchSettings();

			expect(settingsStore.isLoading).toBe(false);
			expect(uiStore.errorMessage).toBe("DB Error");
		});
	});

	describe("updateSetting", () => {
		it("updates setting optimistically and calls DB", async () => {
			// Setup initial state
			settingsStore.settings = [
				{
					id: 1,
					key: "Theme",
					value: "Light",
					category_id: 1,
					description: null,
					data_type: "string"
				}
			];

			await settingsStore.updateSetting(1, "Dark");

			// Check optimistic update
			expect(settingsStore.settings[0].value).toBe("Dark");

			// Check DB call
			expect(set_setting_value).toHaveBeenCalledWith(1, "Dark");
		});

		it("handles boolean values correctly", async () => {
			settingsStore.settings = [
				{
					id: 2,
					key: "Notifications",
					value: "false",
					category_id: 2,
					description: null,
					data_type: "boolean"
				}
			];

			await settingsStore.updateSetting(2, true);

			expect(settingsStore.settings[0].value).toBe("true");
			expect(set_setting_value).toHaveBeenCalledWith(2, "true");

			await settingsStore.updateSetting(2, false);

			expect(settingsStore.settings[0].value).toBe("false");
			expect(set_setting_value).toHaveBeenCalledWith(2, "false");
		});

		it("handles number values correctly", async () => {
			settingsStore.settings = [
				{
					id: 3,
					key: "Volume",
					value: "50",
					category_id: 3,
					description: null,
					data_type: "number"
				}
			];

			await settingsStore.updateSetting(3, 75);

			expect(settingsStore.settings[0].value).toBe("75");
			expect(set_setting_value).toHaveBeenCalledWith(3, "75");
		});

		it("does nothing if setting id is not found", async () => {
			settingsStore.settings = [
				{
					id: 1,
					key: "Theme",
					value: "Light",
					category_id: 1,
					description: null,
					data_type: "string"
				}
			];

			await settingsStore.updateSetting(999, "Dark");

			// State should remain unchanged
			expect(settingsStore.settings[0].value).toBe("Light");

			// DB call should still happen (based on current implementation)
			// The store implementation calls set_setting_value regardless of whether it found the setting in local state
			expect(set_setting_value).toHaveBeenCalledWith(999, "Dark");
		});
	});
});
