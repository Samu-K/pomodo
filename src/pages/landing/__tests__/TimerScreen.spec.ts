import { createTestingPinia } from "@pinia/testing";
import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import OvertimeDialog from "../../../components/timer/OvertimeDialog.vue";
import { useCategoryStore } from "../../../stores/categories";
import { useSettingsStore } from "../../../stores/settings";
import { useTasks } from "../../../stores/task";
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
	MinusCircle: { template: '<svg class="lucide-minus-circle"></svg>' },
	Minimize2: { template: '<svg class="lucide-minimize-2"></svg>' },
	Maximize2: { template: '<svg class="lucide-maximize-2"></svg>' }
}));

// Mock ResizeObserver & others
vi.stubGlobal(
	"ResizeObserver",
	class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
);
vi.stubGlobal(
	"IntersectionObserver",
	class IntersectionObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
);
vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
	setTimeout(cb, 0)
);
vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
vi.stubGlobal("CSS", { supports: () => false });
vi.stubGlobal("visualViewport", {
	width: 1024,
	height: 768,
	offsetLeft: 0,
	offsetTop: 0,
	pageLeft: 0,
	pageTop: 0,
	scale: 1,
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	dispatchEvent: vi.fn()
});

Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock window dimensions
Object.defineProperty(window, "innerWidth", {
	writable: true,
	configurable: true,
	value: 1024
});
Object.defineProperty(window, "innerHeight", {
	writable: true,
	configurable: true,
	value: 768
});
Object.defineProperty(document.documentElement, "clientWidth", {
	writable: true,
	configurable: true,
	value: 1024
});
Object.defineProperty(document.documentElement, "clientHeight", {
	writable: true,
	configurable: true,
	value: 768
});

const vuetify = createVuetify({
	components,
	directives
});

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
	},
	TaskManager: {
		name: "TaskManager",
		template: '<div class="task-manager"></div>',
		props: ["selectedTaskId"],
		emits: ["select", "clear", "selectCategory", "close"]
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
					}),
					vuetify
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
		// isReady depends on settingsStore.isLoading
		settingsStore.isLoading = false;
		timerStore.mode = TimerMode.FOCUS;
		timerStore.sessionStreak = 0;
		// long_break_interval depends on settings
		settingsStore.settings.push({
			id: 99,
			key: "Long Break Interval",
			value: "4",
			category_id: 1,
			description: null,
			data_type: "number"
		});
		// percent and formattedTime depend on remainingTime and duration
		// Default focus duration is 25*60 = 1500
		timerStore.remainingTime = 1500;
		timerStore.isRunning = false;
		timerStore.categoryId = null;

		categoryStore.categories = [{ id: 1, name: "Work", color: "red" }];
	});

	it("shows loading spinner when not ready", async () => {
		settingsStore.isLoading = true;
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
		settingsStore.settings.push({
			id: 99,
			key: "Long Break Interval",
			value: "4",
			category_id: 1,
			description: null,
			data_type: "number"
		});
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
		const playBtn = wrapper.find('[data-testid="toggle-timer"]');
		expect((playBtn.element as HTMLButtonElement).disabled).toBe(true);
	});

	it("enables play button when category is selected", async () => {
		timerStore.categoryId = 1;
		await wrapper.vm.$nextTick();

		const playBtn = wrapper.find('[data-testid="toggle-timer"]');
		expect((playBtn.element as HTMLButtonElement).disabled).toBe(false);
	});

	it("toggles timer when play button is clicked", async () => {
		timerStore.categoryId = 1;
		await wrapper.vm.$nextTick();

		const playBtn = wrapper.find('[data-testid="toggle-timer"]');
		await playBtn.trigger("click");

		expect(timerStore.toggleTimer).toHaveBeenCalled();
	});

	it("shows REST mode correctly", async () => {
		timerStore.mode = TimerMode.REST;
		// Set remaining time to 5:00 (300 seconds)
		timerStore.remainingTime = 300;
		await wrapper.vm.$nextTick();

		expect(wrapper.text()).toContain("REST");
		expect(wrapper.text()).toContain("05:00");

		// Play button should be enabled in REST mode even without category
		const playBtn = wrapper.find('[data-testid="toggle-timer"]');
		expect((playBtn.element as HTMLButtonElement).disabled).toBe(false);
	});

	describe("Skip Button Logic", () => {
		it("is enabled in Focus mode if paused", async () => {
			timerStore.mode = TimerMode.FOCUS;
			timerStore.isRunning = false;
			// Set remaining time to 50% of 25:00 (1500s) -> 750s
			timerStore.remainingTime = 750;
			await wrapper.vm.$nextTick();

			const skipBtn = wrapper.find('[data-testid="skip-timer"]');
			expect(skipBtn.exists()).toBe(true);
			expect((skipBtn.element as HTMLButtonElement).disabled).toBe(false);
		});

		it("is hidden in Focus mode if running", async () => {
			timerStore.mode = TimerMode.FOCUS;
			timerStore.isRunning = true;
			timerStore.remainingTime = 750;
			await wrapper.vm.$nextTick();

			expect(wrapper.findComponent({ name: "SkipForward" }).exists()).toBe(
				false
			);
		});

		it("is always enabled in Rest mode", async () => {
			(timerStore as WritableTimerStore).mode = TimerMode.REST;
			(timerStore as WritableTimerStore).isRunning = true; // Even if running
			await wrapper.vm.$nextTick();

			const skipBtn = wrapper.find('[data-testid="skip-timer"]');
			expect(skipBtn.exists()).toBe(true);
			expect((skipBtn.element as HTMLButtonElement).disabled).toBe(false);
		});
	});

	describe("Reset Button Logic", () => {
		it("is enabled in Focus mode if paused and not full", async () => {
			timerStore.mode = TimerMode.FOCUS;
			timerStore.isRunning = false;
			timerStore.remainingTime = 750;
			await wrapper.vm.$nextTick();

			const resetBtn = wrapper.find('[data-testid="reset-timer"]');
			expect(resetBtn.exists()).toBe(true);
			expect((resetBtn.element as HTMLButtonElement).disabled).toBe(false);
		});

		it("is hidden in Focus mode if running", async () => {
			timerStore.mode = TimerMode.FOCUS;
			timerStore.isRunning = true;
			timerStore.remainingTime = 750;
			await wrapper.vm.$nextTick();

			expect(wrapper.findComponent({ name: "RotateCcw" }).exists()).toBe(false);
		});

		it("is disabled in Rest mode", async () => {
			timerStore.mode = TimerMode.REST;
			timerStore.isRunning = false;
			// Rest duration default is 5:00 (300s). 50% is 150s.
			timerStore.remainingTime = 150;
			await wrapper.vm.$nextTick();

			const resetBtn = wrapper.find('[data-testid="reset-timer"]');
			expect((resetBtn.element as HTMLButtonElement).disabled).toBe(true);
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
			await wrapper.vm.$nextTick();

			// Check DOM for hold progress circle size
			const circle = wrapper.find(".bg-dark-bg.pointer-events-none");
			expect(circle.exists()).toBe(true);
			const style = circle.attributes("style");
			// Should be greater than 0
			expect(style).not.toContain("width: 0px");
		});

		it("resets hold progress on mouseup", async () => {
			timerStore.mode = TimerMode.FOCUS;
			timerStore.isRunning = true;
			await wrapper.vm.$nextTick();

			const container = wrapper.find(".flex.flex-col.h-full.relative");
			await container.trigger("mousedown");
			vi.advanceTimersByTime(1500); // Halfway

			await container.trigger("mouseup");

			// Check DOM for hold progress circle size
			const circle = wrapper.find(".bg-dark-bg.pointer-events-none");
			// It might be hidden or 0 size
			if (circle.exists()) {
				const style = circle.attributes("style");
				expect(style).toContain("width: 0px");
			}
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
		describe("Mini Mode Toggle Visibility", () => {
			it("is visible when not on mobile", async () => {
				// Mock matchMedia to return non-mobile (fine pointer)
				Object.defineProperty(window, "matchMedia", {
					writable: true,
					value: vi.fn().mockImplementation((query) => ({
						matches: !(query === "(pointer: coarse)"),
						media: query,
						onchange: null,
						addListener: vi.fn(),
						removeListener: vi.fn(),
						addEventListener: vi.fn(),
						removeEventListener: vi.fn(),
						dispatchEvent: vi.fn()
					}))
				});
				settingsStore.isLoading = false;
				await wrapper.vm.$nextTick();

				const toggleBtn = wrapper.find('[data-testid="toggle-mini-mode"]');
				expect(toggleBtn.exists()).toBe(true);
			});

			it("is hidden when on mobile", async () => {
				// Mock matchMedia to return mobile (coarse pointer)
				Object.defineProperty(window, "matchMedia", {
					writable: true,
					value: vi.fn().mockImplementation((query) => ({
						matches: query === "(pointer: coarse)",
						media: query,
						onchange: null,
						addListener: vi.fn(),
						removeListener: vi.fn(),
						addEventListener: vi.fn(),
						removeEventListener: vi.fn(),
						dispatchEvent: vi.fn()
					}))
				});

				// Remount the component to pick up the new matchMedia mock
				wrapper.unmount();
				wrapper = mount(TimerScreen, {
					global: {
						plugins: [
							createTestingPinia({
								createSpy: vi.fn,
								stubActions: true
							}),
							vuetify
						],
						stubs: globalStubs
					}
				});

				// Re-initialize store references
				timerStore = useTimerStore();
				categoryStore = useCategoryStore();
				settingsStore = useSettingsStore();

				// Set up the same initial state as beforeEach
				settingsStore.isLoading = false;
				settingsStore.settings.push({
					id: 99,
					key: "Long Break Interval",
					value: "4",
					category_id: 1,
					description: null,
					data_type: "number"
				});
				timerStore.mode = TimerMode.FOCUS;
				timerStore.sessionStreak = 0;
				timerStore.remainingTime = 1500;
				timerStore.isRunning = false;
				timerStore.categoryId = null;
				categoryStore.categories = [{ id: 1, name: "Work", color: "red" }];

				await wrapper.vm.$nextTick();

				const toggleBtn = wrapper.find('[data-testid="toggle-mini-mode"]');
				expect(toggleBtn.exists()).toBe(false);
			});
		});
	});
	describe("Overtime / Don't Know Logic", () => {
		it("does nothing to task when Don't Know is selected", async () => {
			timerStore.taskId = 123;
			timerStore.mode = TimerMode.REST;

			const task = {
				id: 123,
				title: "Test",
				cycles: 4,
				completedCycles: 4,
				category: null,
				category_id: null,
				project_id: null,
				startTime: new Date(),
				completed: false,
				gradient: ""
			};
			const tasksStore = useTasks();
			tasksStore.tasks = [task];
			tasksStore.updateTask = vi.fn(); // Mock updateTask

			await wrapper.vm.$nextTick();

			const overtimeDialog = wrapper.findComponent(OvertimeDialog);
			expect(overtimeDialog.exists()).toBe(true);

			// Simulate "Don't know" -> emit confirm 0
			await overtimeDialog.vm.$emit("confirm", 0);
			await wrapper.vm.$nextTick();

			// Should NOT update task, just close dialog (UI state)
			expect(tasksStore.updateTask).not.toHaveBeenCalled();
			expect(wrapper.findComponent(OvertimeDialog).props("modelValue")).toBe(
				false
			);
		});

		it("updates cycles when explicit overtime is added", async () => {
			const task = {
				id: 123,
				title: "Test",
				cycles: 4,
				completedCycles: 4,
				category: null,
				category_id: null,
				project_id: null,
				startTime: new Date(),
				completed: false,
				gradient: ""
			};
			const tasksStore = useTasks();
			tasksStore.tasks = [task];
			tasksStore.updateTask = vi.fn();

			timerStore.taskId = 123; // MUST set taskId for selectedTask to work

			await wrapper.vm.$nextTick();
			const overtimeDialog = wrapper.findComponent(OvertimeDialog);

			// Add +2 cycles
			await overtimeDialog.vm.$emit("confirm", 2);

			expect(tasksStore.updateTask).toHaveBeenCalledWith(
				expect.objectContaining({
					id: 123,
					cycles: 6 // 4 + 2
				}),
				false
			);
		});
	});
});
