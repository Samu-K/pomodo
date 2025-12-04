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

// Mock Worker
const postMessageMock = vi.fn();
const terminateMock = vi.fn();
let onMessageCallback: ((e: MessageEvent) => void) | null = null;

class MockWorker {
	postMessage(data: unknown) {
		postMessageMock(data);
	}

	set onmessage(callback: ((e: MessageEvent) => void) | null) {
		onMessageCallback = callback;
	}

	get onmessage() {
		return onMessageCallback;
	}

	terminate() {
		terminateMock();
	}
}

vi.stubGlobal("Worker", MockWorker);

describe("Timer Store", () => {
	let timerStore: ReturnType<typeof useTimerStore>;
	let settingsStore: ReturnType<typeof useSettingsStore>;

	beforeEach(() => {
		setActivePinia(createPinia());
		settingsStore = useSettingsStore();

		// Mock settings before initializing timer store to avoid fetchSettings call
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

	describe("Initialization", () => {
		it("initializes with default state", () => {
			expect(timerStore.mode).toBe(TimerMode.FOCUS);
			expect(timerStore.isRunning).toBe(false);
			expect(timerStore.sessionStreak).toBe(0);
			expect(timerStore.categoryId).toBeNull();
		});

		it("fetches settings if empty", () => {
			setActivePinia(createPinia());
			const localSettingsStore = useSettingsStore();
			localSettingsStore.settings = [];
			localSettingsStore.fetchSettings = vi.fn();

			useTimerStore();
			expect(localSettingsStore.fetchSettings).toHaveBeenCalled();
		});
	});

	describe("Getters", () => {
		it("calculates formattedTime correctly", () => {
			timerStore.remainingTime = 1500; // 25 mins
			expect(timerStore.formattedTime).toBe("25:00");

			timerStore.remainingTime = 65; // 1 min 5 sec
			expect(timerStore.formattedTime).toBe("01:05");

			timerStore.remainingTime = 3665; // 1 hr 1 min 5 sec
			expect(timerStore.formattedTime).toBe("01:01:05");
		});

		it("calculates percent correctly", () => {
			timerStore.remainingTime = 750;
			expect(timerStore.percent).toBe(50);

			timerStore.remainingTime = 1500;
			expect(timerStore.percent).toBe(100);
		});
	});

	describe("Actions", () => {
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
			expect(timerStore.isRunning).toBe(true);

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
			expect(postMessageMock).toHaveBeenCalledWith({ type: "PAUSE" });
		});

		it("skip switches modes", () => {
			timerStore.mode = TimerMode.FOCUS;
			timerStore.sessionStreak = 0;

			timerStore.skip();

			expect(timerStore.mode).toBe(TimerMode.REST);
			expect(timerStore.sessionStreak).toBe(1);
			expect(timerStore.remainingTime).toBe(300);
			expect(postMessageMock).toHaveBeenCalledWith({ type: "PAUSE" });

			timerStore.skip();

			expect(timerStore.mode).toBe(TimerMode.FOCUS);
			expect(timerStore.remainingTime).toBe(1500);
		});

		it("skip handles long break", () => {
			timerStore.mode = TimerMode.FOCUS;
			timerStore.sessionStreak = 3;

			timerStore.skip();

			expect(timerStore.mode).toBe(TimerMode.REST);
			expect(timerStore.sessionStreak).toBe(4);
			expect(timerStore.remainingTime).toBe(900);
		});

		it("setCategoryId updates category", () => {
			timerStore.setCategoryId(123);
			expect(timerStore.categoryId).toBe(123);

			timerStore.setCategoryId(null);
			expect(timerStore.categoryId).toBeNull();
		});
	});

	describe("Timer Logic", () => {
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

			// Wait for async handleComplete
			await Promise.resolve();

			expect(timerStore.mode).toBe(TimerMode.REST);
			expect(timerStore.isRunning).toBe(false);
			expect(timerStore.remainingTime).toBe(300);
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

			await Promise.resolve();

			expect(timerStore.mode).toBe(TimerMode.REST);
			expect(timerStore.isRunning).toBe(true);

			// Should have called START (initial), PAUSE (handleComplete), START (auto-start)
			expect(postMessageMock).toHaveBeenCalledTimes(3);
		});

		it("completes session and triggers long break", async () => {
			timerStore.mode = TimerMode.FOCUS;
			timerStore.sessionStreak = 3;
			timerStore.remainingTime = 1;

			if (onMessageCallback) {
				onMessageCallback({ data: { type: "COMPLETE" } } as MessageEvent);
			}

			await Promise.resolve();

			expect(timerStore.mode).toBe(TimerMode.REST);
			expect(timerStore.remainingTime).toBe(900);
			expect(timerStore.sessionStreak).toBe(4);
		});
	});

	describe("Database Integration", () => {
		it("creates session when starting with category", async () => {
			const { add_session } = await import("../../funcs/db/session");
			vi.mocked(add_session).mockResolvedValue(123); // Return mock ID

			timerStore.mode = TimerMode.FOCUS;
			timerStore.remainingTime = 1500;
			timerStore.setCategoryId(42);

			await timerStore.startTimer();

			expect(add_session).toHaveBeenCalledWith(
				expect.objectContaining({
					category_id: 42,
					duration: 1500,
					finished: false
				})
			);
		});

		it("resets session using currentSessionId", async () => {
			const { add_session, delete_session } = await import(
				"../../funcs/db/session"
			);
			vi.mocked(add_session).mockResolvedValue(123);

			timerStore.mode = TimerMode.FOCUS;
			timerStore.remainingTime = 1500;
			timerStore.setCategoryId(42);

			await timerStore.startTimer();
			expect(timerStore.isRunning).toBe(true);

			await timerStore.resetTimer();

			expect(delete_session).toHaveBeenCalledWith(123);
			expect(timerStore.isRunning).toBe(false);
		});

		it("does not create session when category is null", async () => {
			const { add_session } = await import("../../funcs/db/session");
			vi.clearAllMocks();

			timerStore.mode = TimerMode.FOCUS;
			timerStore.remainingTime = 1500;
			timerStore.setCategoryId(null);

			await timerStore.startTimer();

			expect(add_session).not.toHaveBeenCalled();
		});
	});

	describe("Additional Actions", () => {
		it("toggleTimer toggles from paused to running", async () => {
			timerStore.isRunning = false;
			timerStore.remainingTime = 1500;

			await timerStore.toggleTimer();

			expect(timerStore.isRunning).toBe(true);
			expect(postMessageMock).toHaveBeenCalledWith(
				expect.objectContaining({ type: "START" })
			);
		});

		it("toggleTimer toggles from running to paused", async () => {
			await timerStore.startTimer();
			expect(timerStore.isRunning).toBe(true);

			timerStore.toggleTimer();

			expect(timerStore.isRunning).toBe(false);
			expect(postMessageMock).toHaveBeenCalledWith({ type: "PAUSE" });
		});

		it("resetTimer resets in REST mode (short break)", async () => {
			timerStore.mode = TimerMode.REST;
			timerStore.sessionStreak = 2;
			timerStore.remainingTime = 100;

			await timerStore.resetTimer();

			expect(timerStore.isRunning).toBe(false);
			expect(timerStore.remainingTime).toBe(300);
		});

		it("resetTimer resets in REST mode (long break)", async () => {
			timerStore.mode = TimerMode.REST;
			timerStore.sessionStreak = 4;
			timerStore.remainingTime = 100;

			await timerStore.resetTimer();

			expect(timerStore.isRunning).toBe(false);
			expect(timerStore.remainingTime).toBe(900);
		});

		it("setCategoryId handles undefined", () => {
			timerStore.setCategoryId(123);
			expect(timerStore.categoryId).toBe(123);

			timerStore.setCategoryId(undefined);
			expect(timerStore.categoryId).toBeNull();
		});
	});

	describe("Settings Watcher", () => {
		it("updates remainingTime when settings change in REST mode (short break)", async () => {
			timerStore.mode = TimerMode.REST;
			timerStore.sessionStreak = 2;
			timerStore.isRunning = false;

			const shortBreakSetting = settingsStore.settings.find(
				(s) => s.key === "Short Break Time"
			);
			if (shortBreakSetting) {
				shortBreakSetting.value = "10";
			}

			await Promise.resolve();
			await Promise.resolve();

			expect(timerStore.remainingTime).toBe(600);
		});

		it("updates remainingTime when settings change in REST mode (long break)", async () => {
			timerStore.mode = TimerMode.REST;
			timerStore.sessionStreak = 4;
			timerStore.isRunning = false;

			const longBreakSetting = settingsStore.settings.find(
				(s) => s.key === "Long Break Time"
			);
			if (longBreakSetting) {
				longBreakSetting.value = "20";
			}

			await Promise.resolve();
			await Promise.resolve();

			expect(timerStore.remainingTime).toBe(1200);
		});
	});
});
