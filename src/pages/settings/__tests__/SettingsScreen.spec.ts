import { createTestingPinia } from "@pinia/testing";
import { mount, type VueWrapper } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Ref } from "vue";
import type { NavigationGuardWithThis } from "vue-router";
import { useSettingsStore } from "../../../stores/settings";
import { commonIconStubs, vuetify } from "../../../test/test-helpers";
import SettingsScreen from "../SettingsScreen.vue";

interface SettingsScreenExposed {
	hasUnsavedChanges: Ref<boolean>;
	showUnsavedChangesModal: Ref<boolean>;
	saveChanges: () => Promise<void>;
	discardChanges: () => void;
}

const { mockPush, mockBack, mockOnBeforeRouteLeave } = vi.hoisted(() => ({
	mockPush: vi.fn(),
	mockBack: vi.fn(),
	mockOnBeforeRouteLeave: vi.fn()
}));

vi.mock("vue-router", () => ({
	useRouter: () => ({
		push: mockPush,
		back: mockBack
	}),
	onBeforeRouteLeave: (guard: NavigationGuardWithThis<undefined>) =>
		mockOnBeforeRouteLeave(guard)
}));

vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn()
}));

vi.mock("lucide-vue-next", () => ({
	ChevronLeft: commonIconStubs.ChevronLeft,
	Trash2: commonIconStubs.Trash2,
	Cloud: commonIconStubs.Cloud,
	FileJson: commonIconStubs.FileJson,
	FileSpreadsheet: commonIconStubs.FileSpreadsheet,
	Lock: commonIconStubs.Lock
}));

const globalStubs = {
	ErrorBoundary: { template: "<div><slot /></div>" },
	SettingSection: {
		name: "SettingSection",
		template:
			'<div class="setting-section"><slot name="header-actions" /><slot /></div>',
		props: ["settings", "sectionTitle"],
		emits: ["change"]
	},
	ConfirmationModal: {
		name: "ConfirmationModal",
		template: '<div class="confirmation-modal" v-bind="$attrs"></div>',
		emits: ["primary", "secondary", "close"]
	},
	ThemeEditor: { template: "<div></div>" },
	ShortcutRecorder: { template: "<div></div>" },
	TimerPresets: { template: "<div></div>" },
	ICalSettings: { template: "<div></div>" }
};

describe("SettingsScreen.vue", () => {
	let wrapper: VueWrapper;
	let settingsStore: ReturnType<typeof useSettingsStore>;

	beforeEach(() => {
		wrapper = mount(SettingsScreen, {
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						stubActions: true,
						initialState: {
							settings: {
								settings: [
									{ id: 1, key: "Test", value: "false", category_id: 1 }
								],
								categories: [{ id: 1, name: "General" }]
							}
						}
					}),
					vuetify
				],
				stubs: globalStubs
			}
		});
		settingsStore = useSettingsStore();
	});

	it("detects unsaved changes correctly", async () => {
		await wrapper.vm.$nextTick();
		const settingSection = wrapper.findComponent({ name: "SettingSection" });

		settingSection.vm.$emit("change", 1, true);
		await wrapper.vm.$nextTick();

		expect(
			(wrapper.vm as unknown as SettingsScreenExposed).hasUnsavedChanges
		).toBe(true);
	});

	it("saves changes when requested", async () => {
		await wrapper.vm.$nextTick();
		const settingSection = wrapper.findComponent({ name: "SettingSection" });

		settingSection.vm.$emit("change", 1, true);
		await wrapper.vm.$nextTick();

		await (wrapper.vm as unknown as SettingsScreenExposed).saveChanges();

		expect(settingsStore.updateSetting).toHaveBeenCalledWith(1, "true");
		expect(
			(wrapper.vm as unknown as SettingsScreenExposed).hasUnsavedChanges
		).toBe(false);
	});

	it("discards changes when requested", async () => {
		await wrapper.vm.$nextTick();
		const settingSection = wrapper.findComponent({ name: "SettingSection" });

		settingSection.vm.$emit("change", 1, true);
		await wrapper.vm.$nextTick();

		(wrapper.vm as unknown as SettingsScreenExposed).discardChanges();

		expect(
			(wrapper.vm as unknown as SettingsScreenExposed).hasUnsavedChanges
		).toBe(false);
	});

	it("handles navigation guard correctly", async () => {
		await wrapper.vm.$nextTick();

		// Trigger unsaved changes via SettingSection emit (same as other tests)
		const settingSection = wrapper.findComponent({ name: "SettingSection" });
		settingSection.vm.$emit("change", 1, true);
		await wrapper.vm.$nextTick();

		expect(
			(wrapper.vm as unknown as SettingsScreenExposed).hasUnsavedChanges
		).toBe(true);

		const next = vi.fn();
		expect(mockOnBeforeRouteLeave).toHaveBeenCalled();
		const guard = mockOnBeforeRouteLeave.mock.calls[0][0];

		// Call the guard with custom 'to' - should block navigation
		guard({ fullPath: "/new" }, {}, next);

		await wrapper.vm.$nextTick();

		// Verify navigation was blocked when there are unsaved changes
		expect(next).toHaveBeenCalledWith(false);
	});
});
