import { createTestingPinia } from "@pinia/testing";
import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCategoryStore } from "../../../stores/categories";
import { useSettingsStore } from "../../../stores/settings";
import { TimerMode, useTimerStore } from "../../../stores/timer";
import TimerScreen from "../TimerScreen.vue";

type WritableTimerStore = ReturnType<typeof useTimerStore> & {
	isReady: boolean;
	mode: TimerMode;
	sessionStreak: number;
	long_break_interval: number;
	percent: number;
	formattedTime: string;
	isRunning: boolean;
	categoryId: number | null;
};

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
		const writableTimerStore = timerStore as WritableTimerStore;
		writableTimerStore.isReady = true;
		writableTimerStore.mode = TimerMode.FOCUS;
		writableTimerStore.sessionStreak = 0;
		writableTimerStore.long_break_interval = 4;
		writableTimerStore.percent = 100;
		writableTimerStore.formattedTime = "25:00";
		writableTimerStore.isRunning = false;
		writableTimerStore.categoryId = null;

		categoryStore.categories = [{ id: 1, name: "Work", color: "red" }];
	});

	it("shows loading spinner when not ready", async () => {
		(timerStore as WritableTimerStore).isReady = false;
		await wrapper.vm.$nextTick();

		const progress = wrapper.findComponent({ name: "VProgressCircular" });
		expect(progress.exists()).toBe(true);
		expect(progress.props("indeterminate")).not.toBeUndefined();
	});

	it("shows FOCUS mode initially", async () => {
		expect(wrapper.text()).toContain("FOCUS");
		expect(wrapper.text()).toContain("25:00");
	});

	it("renders session streak as circles", async () => {
		(timerStore as WritableTimerStore).long_break_interval = 4;
		timerStore.sessionStreak = 2;
		await wrapper.vm.$nextTick();

		const circles = wrapper.findAll(
			".rounded-full.border.border-pomodo-orange"
		);
		// We expect 4 circles total
		expect(circles.length).toBe(4);

		// First 2 should be filled (bg-pomodo-orange)
		expect(circles[0].classes()).toContain("bg-pomodo-orange");
		expect(circles[1].classes()).toContain("bg-pomodo-orange");

		// Last 2 should be empty (bg-transparent)
		expect(circles[2].classes()).toContain("bg-transparent");
		expect(circles[3].classes()).toContain("bg-transparent");
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
		(timerStore as WritableTimerStore).mode = TimerMode.REST;
		(timerStore as WritableTimerStore).formattedTime = "05:00";
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).toContain("REST");
		expect(wrapper.text()).toContain("05:00");

		// Play button should be enabled in REST mode even without category
		const playBtn = wrapper.findAll("button")[1];
		expect(playBtn.element.disabled).toBe(false);
	});

	describe("Skip Button Logic", () => {
		it("is enabled in Focus mode if paused", async () => {
			(timerStore as WritableTimerStore).mode = TimerMode.FOCUS;
			(timerStore as WritableTimerStore).isRunning = false;
			(timerStore as WritableTimerStore).percent = 50;
			await wrapper.vm.$nextTick();

			const skipBtn = wrapper.findAll("button")[2];
			expect(skipBtn.exists()).toBe(true);
			expect(skipBtn.element.disabled).toBe(false);
		});

		it("is hidden in Focus mode if running", async () => {
			(timerStore as WritableTimerStore).mode = TimerMode.FOCUS;
			(timerStore as WritableTimerStore).isRunning = true;
			(timerStore as WritableTimerStore).percent = 50;
			await wrapper.vm.$nextTick();

			expect(wrapper.findComponent({ name: "SkipForward" }).exists()).toBe(
				false
			);
		});

		it("is always enabled in Rest mode", async () => {
			(timerStore as WritableTimerStore).mode = TimerMode.REST;
			(timerStore as WritableTimerStore).isRunning = true; // Even if running
			await wrapper.vm.$nextTick();

			const skipBtn = wrapper.findAll("button")[2];
			expect(skipBtn.exists()).toBe(true);
			expect(skipBtn.element.disabled).toBe(false);
		});
	});

	describe("Reset Button Logic", () => {
		it("is enabled in Focus mode if paused and not full", async () => {
			(timerStore as WritableTimerStore).mode = TimerMode.FOCUS;
			(timerStore as WritableTimerStore).isRunning = false;
			(timerStore as WritableTimerStore).percent = 50;
			await wrapper.vm.$nextTick();

			const resetBtn = wrapper.findAll("button")[0];
			expect(resetBtn.exists()).toBe(true);
			expect(resetBtn.element.disabled).toBe(false);
		});

		it("is hidden in Focus mode if running", async () => {
			(timerStore as WritableTimerStore).mode = TimerMode.FOCUS;
			(timerStore as WritableTimerStore).isRunning = true;
			(timerStore as WritableTimerStore).percent = 50;
			await wrapper.vm.$nextTick();

			expect(wrapper.findComponent({ name: "RotateCcw" }).exists()).toBe(false);
		});

		it("is disabled in Rest mode", async () => {
			(timerStore as WritableTimerStore).mode = TimerMode.REST;
			(timerStore as WritableTimerStore).isRunning = false;
			(timerStore as WritableTimerStore).percent = 50;
			await wrapper.vm.$nextTick();

			const resetBtn = wrapper.findAll("button")[0];
			expect(resetBtn.element.disabled).toBe(true);
		});
	});

	describe("Hold to Pause Logic", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("starts hold progress on mousedown", async () => {
			timerStore.mode = TimerMode.FOCUS;
			timerStore.isRunning = true;
			await wrapper.vm.$nextTick();

			const container = wrapper.find(".flex.flex-col.h-full.relative");
			await container.trigger("mousedown");

			// Advance time slightly
			vi.advanceTimersByTime(100);

			expect(
				(wrapper.vm as unknown as { holdProgress: number }).holdProgress
			).toBeGreaterThan(0);
		});

		it("resets hold progress on mouseup", async () => {
			timerStore.mode = TimerMode.FOCUS;
			timerStore.isRunning = true;
			await wrapper.vm.$nextTick();

			const container = wrapper.find(".flex.flex-col.h-full.relative");
			await container.trigger("mousedown");
			vi.advanceTimersByTime(1500); // Halfway

			await container.trigger("mouseup");

			expect(
				(wrapper.vm as unknown as { holdProgress: number }).holdProgress
			).toBe(0);
		});

		it("pauses timer after holding for duration", async () => {
			timerStore.mode = TimerMode.FOCUS;
			timerStore.isRunning = true;
			await wrapper.vm.$nextTick();

			const container = wrapper.find(".flex.flex-col.h-full.relative");
			await container.trigger("mousedown");

			// Advance full duration (3000ms) + a bit buffer
			vi.advanceTimersByTime(3100);

			expect(timerStore.pauseTimer).toHaveBeenCalled();
		});
	});
});
