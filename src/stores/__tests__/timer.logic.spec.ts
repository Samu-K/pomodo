import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "../settings";
import { TimerMode, useTimerStore } from "../timer";

// Mock DB functions
vi.mock("../../funcs/db/session", () => ({
	add_session: vi.fn(),
	delete_session: vi.fn(),
	set_newest_session_complete: vi.fn()
}));

vi.mock("../../composables/useTimerFeedback", () => ({
	useTimerFeedback: () => ({
		triggerAllFeedback: vi.fn(),
		playSound: vi.fn(),
		triggerHaptics: vi.fn(),
		sendTimerNotification: vi.fn(),
		scheduleFinishedNotification: vi.fn(),
		cancelScheduledNotification: vi.fn()
	})
}));

// Mock Worker
const postMessageMock = vi.fn();
let onMessageCallback: ((e: MessageEvent) => void) | null = null;

class MockWorker {
	postMessage(data: Parameters<typeof Worker.prototype.postMessage>[0]) {
		postMessageMock(data);
	}
	set onmessage(callback: ((e: MessageEvent) => void) | null) {
		onMessageCallback = callback;
	}
	get onmessage(): ((e: MessageEvent) => void) | null {
		return onMessageCallback;
	}
	terminate() {}
}

vi.stubGlobal("Worker", MockWorker);

describe("Timer Store Logic", () => {
	let timerStore: ReturnType<typeof useTimerStore>;
	let settingsStore: ReturnType<typeof useSettingsStore>;

	beforeEach(() => {
		setActivePinia(createPinia());
		settingsStore = useSettingsStore();
		settingsStore.settings = [
			{
				id: 1,
				key: "Focus Duration",
				value: "25",
				category_id: 1,
				description: "",
				data_type: "number"
			},
			{
				id: 2,
				key: "Short Break Time",
				value: "5",
				category_id: 1,
				description: "",
				data_type: "number"
			},
			{
				id: 3,
				key: "Long Break Time",
				value: "15",
				category_id: 1,
				description: "",
				data_type: "number"
			},
			{
				id: 4,
				key: "Long Break Interval",
				value: "4",
				category_id: 1,
				description: "",
				data_type: "number"
			},
			{
				id: 5,
				key: "Auto Start Break",
				value: "false",
				category_id: 1,
				description: "",
				data_type: "boolean"
			},
			{
				id: 6,
				key: "Auto Start Focus",
				value: "false",
				category_id: 1,
				description: "",
				data_type: "boolean"
			}
		];
		settingsStore.isLoading = false;
		settingsStore.fetchSettings = vi.fn();
		timerStore = useTimerStore();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("updates remainingTime on TICK message", async () => {
		await timerStore.startTimer();
		if (onMessageCallback) {
			onMessageCallback({
				data: { type: "TICK", payload: { remainingTime: 1400 } }
			} as MessageEvent);
		}
		expect(timerStore.remainingTime).toBe(1400);
	});

	it("completes session on COMPLETE message", async () => {
		timerStore.mode = TimerMode.FOCUS;
		timerStore.remainingTime = 1;
		timerStore.isRunning = true;
		if (onMessageCallback) {
			onMessageCallback({ data: { type: "COMPLETE" } } as MessageEvent);
		}
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(timerStore.mode).toBe(TimerMode.REST);
		expect(timerStore.isRunning).toBe(false);
	});

	it("auto-starts break if enabled", async () => {
		const autoStartSetting = settingsStore.settings.find(
			(s) => s.key === "Auto Start Break"
		);
		if (autoStartSetting) autoStartSetting.value = "true";
		timerStore.remainingTime = 1;
		await timerStore.startTimer();
		if (onMessageCallback) {
			onMessageCallback({ data: { type: "COMPLETE" } } as MessageEvent);
		}
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(timerStore.mode).toBe(TimerMode.REST);
		expect(timerStore.isRunning).toBe(true);
	});

	it("handles settings changes", async () => {
		timerStore.mode = TimerMode.REST;
		const shortBreakSetting = settingsStore.settings.find(
			(s) => s.key === "Short Break Time"
		);
		if (shortBreakSetting) shortBreakSetting.value = "10";
		await Promise.resolve();
		await Promise.resolve();
		expect(timerStore.remainingTime).toBe(600);
	});
});
