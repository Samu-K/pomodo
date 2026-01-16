import { createTestingPinia } from "@pinia/testing";
import { mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCategoryStore } from "../../../stores/categories";
import { useSettingsStore } from "../../../stores/settings";
import { TimerMode, useTimerStore } from "../../../stores/timer";
import { useUIStore } from "../../../stores/ui";
import {
	commonIconStubs,
	setupBrowserMocks,
	vuetify
} from "../../../test/test-helpers";
import TimerScreen from "../TimerScreen.vue";

// Setup browser mocks once
setupBrowserMocks();

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

// Mock Lucide Icons
vi.mock("lucide-vue-next", () => ({
	Pause: commonIconStubs.Pause,
	Play: commonIconStubs.Play,
	RotateCcw: commonIconStubs.RotateCcw,
	SkipForward: commonIconStubs.SkipForward,
	Minimize2: commonIconStubs.Minimize2,
	Maximize2: commonIconStubs.Maximize2
}));

const globalStubs = {
	VProgressCircular: {
		name: "VProgressCircular",
		template: '<div v-bind="$attrs"><slot /></div>'
	},
	CategoryManager: {
		template: "<div></div>",
		props: ["selectedCategory"],
		emits: ["select"]
	},
	TaskManager: {
		template: "<div></div>",
		props: ["selectedTaskId"],
		emits: ["select", "clear", "selectCategory", "close"]
	},
	TimerControls: {
		name: "TimerControls",
		template: "<div></div>",
		props: ["selectedCategory", "canStart"]
	},
	TimerDisplay: { template: "<div></div>" },
	TaskCompletionDialog: {
		template: "<div></div>",
		props: ["modelValue", "task"],
		emits: ["confirm", "cancel"]
	},
	OvertimeDialog: {
		template: "<div></div>",
		props: ["modelValue"],
		emits: ["confirm"]
	}
};

describe("TimerScreen.vue", () => {
	let wrapper: VueWrapper;
	let timerStore: ReturnType<typeof useTimerStore>;
	let categoryStore: ReturnType<typeof useCategoryStore>;
	let settingsStore: ReturnType<typeof useSettingsStore>;

	beforeEach(() => {
		const pinia = createTestingPinia({
			createSpy: vi.fn,
			stubActions: true
		});

		timerStore = useTimerStore();
		categoryStore = useCategoryStore();
		settingsStore = useSettingsStore();

		settingsStore.isLoading = false;
		timerStore.mode = TimerMode.FOCUS;
		timerStore.remainingTime = 1500;
		timerStore.taskId = null;
		timerStore.projectId = null;
		timerStore.categoryId = null;
		categoryStore.categories = [{ id: 1, name: "Work", color: "red" }];

		wrapper = mount(TimerScreen, {
			global: {
				plugins: [pinia, vuetify],
				stubs: globalStubs
			}
		});
	});

	it("shows loading spinner when not ready", async () => {
		settingsStore.isLoading = true;
		await wrapper.vm.$nextTick();
		expect(wrapper.find('[data-testid="initial-loader"]').exists()).toBe(true);
	});

	it("disables play button if no category selected in FOCUS mode", async () => {
		settingsStore.isLoading = false;
		timerStore.categoryId = null;
		await wrapper.vm.$nextTick();
		const controls = wrapper.findComponent({ name: "TimerControls" });
		expect(controls.props("canStart")).toBe(false);
	});

	it("enables play button when category is selected", async () => {
		timerStore.categoryId = 1;
		categoryStore.categories = [{ id: 1, name: "Work", color: "red" }];
		await wrapper.vm.$nextTick();
		await wrapper.vm.$nextTick();

		const controls = wrapper.findComponent({ name: "TimerControls" });
		expect(controls.props("canStart")).toBe(true);
	});

	describe("Hold to Pause Logic", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});
		afterEach(() => {
			vi.useRealTimers();
		});

		it("pauses timer after holding for duration", async () => {
			timerStore.isRunning = true;
			timerStore.mode = TimerMode.FOCUS;
			await wrapper.vm.$nextTick();

			const container = wrapper.find(".flex-col");
			await container.trigger("mousedown");
			vi.advanceTimersByTime(3100);
			expect(timerStore.pauseTimer).toHaveBeenCalled();
		});
	});

	it("shows mini mode view when active", async () => {
		const uiStore = useUIStore();
		uiStore.isMiniMode = true;
		await wrapper.vm.$nextTick();
		expect(wrapper.findComponent({ name: "MiniTimerView" }).exists()).toBe(
			true
		);
	});
});
