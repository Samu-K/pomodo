import { createTestingPinia } from "@pinia/testing";
import { mount, type VueWrapper } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCategoryStore } from "../../../stores/categories";
import { useSettingsStore } from "../../../stores/settings";
import { TimerMode, useTimerStore } from "../../../stores/timer";
import TimerScreen from "../TimerScreen.vue";

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn()
}));

// Mock Lucide Icons
vi.mock("lucide-vue-next", () => ({
	Pause: { template: '<svg class="lucide-pause"></svg>' },
	Play: { template: '<svg class="lucide-play"></svg>' },
	RotateCcw: { template: '<svg class="lucide-rotate-ccw"></svg>' },
	SkipForward: { template: '<svg class="lucide-skip-forward"></svg>' },
	MinusCircle: { template: '<svg class="lucide-minus-circle"></svg>' }
}));

// Global Stubs
const globalStubs = {
	VProgressCircular: {
		name: "VProgressCircular",
		template: '<div class="v-progress-circular"><slot></slot></div>',
		props: ["indeterminate", "modelValue"]
	},
	CategoryManager: {
		name: "CategoryManager",
		template: '<div class="category-manager"></div>',
		props: ["selectedCategory"],
		emits: ["select"]
	}
};

describe("TimerScreen.vue", () => {
	let wrapper: VueWrapper;
	let timerStore: ReturnType<typeof useTimerStore>;
	let categoryStore: ReturnType<typeof useCategoryStore>;
	let settingsStore: ReturnType<typeof useSettingsStore>;

	beforeEach(() => {
		wrapper = mount(TimerScreen, {
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						stubActions: true // Use stubs for actions, treat store as state container
					})
				],
				stubs: globalStubs
			}
		});

		timerStore = useTimerStore();
		categoryStore = useCategoryStore();
		settingsStore = useSettingsStore();

		// Default initial state
		settingsStore.isLoading = false;

		// Manually set state
		timerStore.isReady = true;
		timerStore.mode = TimerMode.FOCUS;
		timerStore.sessionStreak = 0;
		timerStore.long_break_interval = 4;
		timerStore.percent = 100;
		timerStore.formattedTime = "25:00";
		timerStore.isRunning = false;
		timerStore.categoryId = null;

		categoryStore.categories = [{ id: 1, name: "Work", color: "red" }];
	});

	it("shows loading spinner when not ready", async () => {
		timerStore.isReady = false;
		await wrapper.vm.$nextTick();

		const progress = wrapper.findComponent({ name: "VProgressCircular" });
		expect(progress.exists()).toBe(true);
		expect(progress.props("indeterminate")).not.toBeUndefined();
	});

	it("shows FOCUS mode initially", async () => {
		expect(wrapper.text()).toContain("FOCUS");
		expect(wrapper.text()).toContain("25:00");
	});

	it("shows CategoryManager when timer is reset and not running", async () => {
		expect(wrapper.findComponent({ name: "CategoryManager" }).exists()).toBe(
			true
		);
	});

	it("disables play button if no category selected in FOCUS mode", async () => {
		const playBtn = wrapper.findAll("button")[1]; // The middle big button
		expect(playBtn.element.disabled).toBe(true);
	});

	it("enables play button when category is selected", async () => {
		timerStore.categoryId = 1;
		await wrapper.vm.$nextTick();

		const playBtn = wrapper.findAll("button")[1];
		expect(playBtn.element.disabled).toBe(false);
	});

	it("toggles timer when play button is clicked", async () => {
		timerStore.categoryId = 1;
		await wrapper.vm.$nextTick();

		const playBtn = wrapper.findAll("button")[1];
		await playBtn.trigger("click");

		expect(timerStore.toggleTimer).toHaveBeenCalled();
	});

	it("shows REST mode correctly", async () => {
		timerStore.mode = TimerMode.REST;
		timerStore.formattedTime = "05:00";
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).toContain("REST");
		expect(wrapper.text()).toContain("05:00");

		// Play button should be enabled in REST mode even without category
		const playBtn = wrapper.findAll("button")[1];
		expect(playBtn.element.disabled).toBe(false);
	});

	describe("Skip Button Logic", () => {
		it("is enabled in Focus mode if paused", async () => {
			timerStore.mode = TimerMode.FOCUS;
			timerStore.isRunning = false;
			timerStore.percent = 50;
			await wrapper.vm.$nextTick();

			const skipBtn = wrapper.findAll("button")[2];
			expect(skipBtn.element.disabled).toBe(false);
		});

		it("is disabled in Focus mode if running", async () => {
			timerStore.mode = TimerMode.FOCUS;
			timerStore.isRunning = true;
			timerStore.percent = 50;
			await wrapper.vm.$nextTick();

			const skipBtn = wrapper.findAll("button")[2];
			expect(skipBtn.element.disabled).toBe(true);
		});

		it("is always enabled in Rest mode", async () => {
			timerStore.mode = TimerMode.REST;
			timerStore.isRunning = true; // Even if running
			await wrapper.vm.$nextTick();

			const skipBtn = wrapper.findAll("button")[2];
			expect(skipBtn.element.disabled).toBe(false);
		});
	});

	describe("Reset Button Logic", () => {
		it("is enabled in Focus mode if paused and not full", async () => {
			timerStore.mode = TimerMode.FOCUS;
			timerStore.isRunning = false;
			timerStore.percent = 50;
			await wrapper.vm.$nextTick();

			const resetBtn = wrapper.findAll("button")[0];
			expect(resetBtn.element.disabled).toBe(false);
		});

		it("is disabled in Focus mode if running", async () => {
			timerStore.mode = TimerMode.FOCUS;
			timerStore.isRunning = true;
			timerStore.percent = 50;
			await wrapper.vm.$nextTick();

			const resetBtn = wrapper.findAll("button")[0];
			expect(resetBtn.element.disabled).toBe(true);
		});

		it("is disabled in Rest mode", async () => {
			timerStore.mode = TimerMode.REST;
			timerStore.isRunning = false;
			timerStore.percent = 50;
			await wrapper.vm.$nextTick();

			const resetBtn = wrapper.findAll("button")[0];
			expect(resetBtn.element.disabled).toBe(true);
		});
	});
});
