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
const terminateMock = vi.fn();
let onMessageCallback: ((e: MessageEvent) => void) | null = null;

class MockWorker {
	postMessage(data: Parameters<typeof Worker.prototype.postMessage>[0]) {
		postMessageMock(data);
	}

	set onmessage(callback: (e: MessageEvent) => void) {
		onMessageCallback = callback;
	}

	get onmessage(): ((e: MessageEvent) => void) | null {
		return onMessageCallback;
	}

	terminate() {
		terminateMock();
	}
}

vi.stubGlobal("Worker", MockWorker);

describe("Timer Store Actions", () => {
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
				description: "Focus duration",
				category_id: 1,
				data_type: "number"
			},
			{
				id: 2,
				key: "Short Break Time",
				value: "5",
				description: "Short break duration",
				category_id: 1,
				data_type: "number"
			},
			{
				id: 3,
				key: "Long Break Time",
				value: "15",
				description: "Long break duration",
				category_id: 1,
				data_type: "number"
			},
			{
				id: 4,
				key: "Long Break Interval",
				value: "4",
				description: "Long break interval",
				category_id: 1,
				data_type: "number"
			},
			{
				id: 5,
				key: "Auto Start Break",
				value: "false",
				description: "Auto start break",
				category_id: 1,
				data_type: "boolean"
			},
			{
				id: 6,
				key: "Auto Start Focus",
				value: "false",
				description: "Auto start focus",
				category_id: 1,
				data_type: "boolean"
			}
		];
		settingsStore.isLoading = false;
		settingsStore.fetchSettings = vi.fn();

		postMessageMock.mockClear();
		onMessageCallback = null;

		timerStore = useTimerStore();
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	describe("Initialization & Getters", () => {
		it("initializes with default state", () => {
			expect(timerStore.mode).toBe(TimerMode.FOCUS);
			expect(timerStore.isRunning).toBe(false);
			expect(timerStore.sessionStreak).toBe(0);
			expect(timerStore.categoryId).toBeNull();
		});

		it("calculates formattedTime correctly", () => {
			timerStore.remainingTime = 1500; // 25 mins
			expect(timerStore.formattedTime).toBe("25:00");

			timerStore.remainingTime = 65; // 1 min 5 sec
			expect(timerStore.formattedTime).toBe("01:05");
		});

		it("calculates percent correctly", () => {
			timerStore.remainingTime = 750;
			expect(timerStore.percent).toBe(50);
		});
	});

	describe("Core Actions", () => {
		it("startTimer starts the timer and sends message to worker", async () => {
			timerStore.remainingTime = 1500;
			await timerStore.startTimer();
			expect(timerStore.isRunning).toBe(true);
			expect(postMessageMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "START",
					payload: expect.objectContaining({ endTime: expect.any(Number) })
				})
			);
		});

		it("pauseTimer stops the timer and sends message to worker", async () => {
			await timerStore.startTimer();
			timerStore.pauseTimer();
			expect(timerStore.isRunning).toBe(false);
			expect(postMessageMock).toHaveBeenCalledWith({ type: "PAUSE" });
		});

		it("resetTimer resets state", async () => {
			timerStore.remainingTime = 1000;
			timerStore.isRunning = true;
			await timerStore.resetTimer();
			expect(timerStore.isRunning).toBe(false);
			expect(timerStore.remainingTime).toBe(1500);
		});

		it("skip switches modes", async () => {
			timerStore.mode = TimerMode.FOCUS;
			await timerStore.skip();
			expect(timerStore.mode).toBe(TimerMode.REST);
			expect(timerStore.sessionStreak).toBe(1);
			expect(timerStore.remainingTime).toBe(300);
		});

		it("toggleTimer toggles state", async () => {
			timerStore.isRunning = false;
			await timerStore.toggleTimer();
			expect(timerStore.isRunning).toBe(true);
			await timerStore.toggleTimer();
			expect(timerStore.isRunning).toBe(false);
		});

		it("setCategoryId updates category", () => {
			timerStore.setCategoryId(123);
			expect(timerStore.categoryId).toBe(123);
			timerStore.setCategoryId(null);
			expect(timerStore.categoryId).toBeNull();
		});
	});
});
