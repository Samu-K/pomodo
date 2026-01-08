import { createTestingPinia } from "@pinia/testing";
import { mount, type VueWrapper } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "../../../stores/settings";
import SettingsScreen from "../SettingsScreen.vue";

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn()
}));

// Mock Lucide Icons
vi.mock("lucide-vue-next", () => ({
	ChevronLeft: { template: '<svg class="lucide-chevron-left"></svg>' },
	X: { template: '<svg class="lucide-x"></svg>' },
	Cloud: { template: '<svg class="lucide-cloud"></svg>' },
	Lock: { template: '<svg class="lucide-lock"></svg>' },
	FileJson: { template: '<svg class="lucide-file-json"></svg>' },
	FileSpreadsheet: { template: '<svg class="lucide-file-spreadsheet"></svg>' },
	Download: { template: '<svg class="lucide-download"></svg>' }
}));

// Mock Vue Router
const pushMock = vi.fn();
const backMock = vi.fn();
const beforeRouteLeaveMock = vi.fn();

import type { NavigationGuard } from "vue-router";
import type { Setting } from "../../../funcs/commands";

type SettingsComponent = {
	hasUnsavedChanges: boolean;
	showUnsavedChangesModal: boolean;
	pendingRoute: string | null;
	draftSettings: Setting[];
};

vi.mock("vue-router", () => ({
	useRouter: () => ({
		push: pushMock,
		back: backMock
	}),
	onBeforeRouteLeave: (guard: NavigationGuard) => {
		beforeRouteLeaveMock.mockImplementation(guard);
	}
}));

// Global Stubs
const globalStubs = {
	ErrorBoundary: {
		template: "<div><slot /></div>"
	},
	SettingSection: {
		name: "SettingSection",
		template: '<div class="setting-section"><slot /></div>',
		props: ["settings", "sectionTitle"],
		emits: ["change"]
	},
	ConfirmationModal: {
		name: "ConfirmationModal",
		template: '<div class="confirmation-modal"></div>',
		emits: ["primary", "secondary", "close"]
	},
	"v-select": {
		template: '<div class="v-select"></div>',
		props: ["items", "modelValue"],
		emits: ["update:modelValue"]
	},
	"v-list-item": {
		template: '<div class="v-list-item"></div>',
		props: ["title"]
	}
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
									{
										id: 1,
										key: "Test Setting",
										value: "false",
										category_id: 1,
										description: "A test setting",
										data_type: "boolean"
									}
								],
								categories: [
									{ id: 1, name: "General", description: "General settings" }
								]
							}
						}
					})
				],
				stubs: globalStubs
			}
		});

		settingsStore = useSettingsStore();
	});

	it("Modifying does not save immediately", async () => {
		// Wait for initial watch to trigger
		await wrapper.vm.$nextTick();

		// Find the component and trigger a change
		// Since we stubbed SettingSection, we need to emit the change event from it
		const settingSection = wrapper.findComponent({ name: "SettingSection" });
		expect(settingSection.exists()).toBe(true);

		// Simulate changing the setting with id 1 to true
		settingSection.vm.$emit("change", 1, true);
		await wrapper.vm.$nextTick();

		// Verify updateSetting was NOT called
		expect(settingsStore.updateSetting).not.toHaveBeenCalled();

		// Verify hasUnsavedChanges is true (we can check the save button state)
		// The save button is disabled if !hasUnsavedChanges
		const saveButton = wrapper
			.findAll("button")
			.find((b) => b.text() === "Save Changes");
		expect(saveButton?.element.disabled).toBe(false);
	});

	it("Changes happen only once 'Save changes' is pressed", async () => {
		await wrapper.vm.$nextTick();
		const settingSection = wrapper.findComponent({ name: "SettingSection" });

		// Change setting
		settingSection.vm.$emit("change", 1, true);
		await wrapper.vm.$nextTick();

		// Click save
		const saveButton = wrapper
			.findAll("button")
			.find((b) => b.text() === "Save Changes");
		await saveButton?.trigger("click");

		// Verify updateSetting WAS called
		expect(settingsStore.updateSetting).toHaveBeenCalledWith(1, "true");
	});

	it("Leaving page WITH NO pending changes DOES NOT open prompt modal", async () => {
		// Let's verify the state is correct.
		await wrapper.vm.$nextTick();
		// accessing internal state for testing
		expect((wrapper.vm as object as SettingsComponent).hasUnsavedChanges).toBe(
			false
		);
	});

	it("Leaving page WITH pending changes DOES open modal (simulated)", async () => {
		await wrapper.vm.$nextTick();
		const settingSection = wrapper.findComponent({ name: "SettingSection" });
		settingSection.vm.$emit("change", 1, true);
		await wrapper.vm.$nextTick();

		expect((wrapper.vm as object as SettingsComponent).hasUnsavedChanges).toBe(
			true
		);
	});

	it("Modal works correctly (Save)", async () => {
		// Manually show modal to test its events
		(wrapper.vm as object as SettingsComponent).showUnsavedChangesModal = true;
		(wrapper.vm as object as SettingsComponent).pendingRoute = "/some-route";
		(wrapper.vm as object as SettingsComponent).hasUnsavedChanges = true;
		(wrapper.vm as object as SettingsComponent).draftSettings = [
			{ id: 1, value: "true" } as Setting
		]; // Changed value

		await wrapper.vm.$nextTick();

		const modal = wrapper.findComponent({ name: "ConfirmationModal" });
		expect(modal.exists()).toBe(true);

		// Emit save (primary)
		modal.vm.$emit("primary");
		await wrapper.vm.$nextTick();

		// Verify save logic ran
		expect(settingsStore.updateSetting).toHaveBeenCalled();
		expect(
			(wrapper.vm as object as SettingsComponent).showUnsavedChangesModal
		).toBe(false);
	});

	it("Modal works correctly (Discard)", async () => {
		(wrapper.vm as object as SettingsComponent).showUnsavedChangesModal = true;
		(wrapper.vm as object as SettingsComponent).pendingRoute = "/some-route";
		(wrapper.vm as object as SettingsComponent).hasUnsavedChanges = true;
		(wrapper.vm as object as SettingsComponent).draftSettings = [
			{ id: 1, value: "true" } as Setting
		]; // Changed value

		await wrapper.vm.$nextTick();

		const modal = wrapper.findComponent({ name: "ConfirmationModal" });

		// Emit discard (secondary)
		modal.vm.$emit("secondary");
		await wrapper.vm.$nextTick();

		// Verify updateSetting NOT called
		expect(settingsStore.updateSetting).not.toHaveBeenCalled();
		expect(
			(wrapper.vm as object as SettingsComponent).showUnsavedChangesModal
		).toBe(false);
		expect((wrapper.vm as object as SettingsComponent).hasUnsavedChanges).toBe(
			false
		);
	});

	it("Modal works correctly (Cancel)", async () => {
		(wrapper.vm as object as SettingsComponent).showUnsavedChangesModal = true;
		(wrapper.vm as object as SettingsComponent).pendingRoute = "/some-route";

		await wrapper.vm.$nextTick();

		const modal = wrapper.findComponent({ name: "ConfirmationModal" });

		// Emit cancel (close)
		modal.vm.$emit("close");
		await wrapper.vm.$nextTick();

		expect(
			(wrapper.vm as object as SettingsComponent).showUnsavedChangesModal
		).toBe(false);

		expect((wrapper.vm as object as SettingsComponent).pendingRoute).toBeNull();
	});
});
