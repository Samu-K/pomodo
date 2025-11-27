import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "../settings";
import { TimerMode, useTimerStore } from "../timer";

// Mock DB functions
vi.mock("../../funcs/db/session", () => ({
	add_session: vi.fn(),
	delete_latest_session: vi.fn(),
	set_newest_session_complete: vi.fn()
}));

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
			// We need to simulate the condition where settings are empty
			// Since timerStore is already created in beforeEach with populated settings,
			// we need to create a NEW pinia environment for this test.
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
			// Focus mode: 25 mins = 1500s
			timerStore.remainingTime = 750;
			expect(timerStore.percent).toBe(50);

			timerStore.remainingTime = 1500;
			expect(timerStore.percent).toBe(100);
		});
	});

	describe("Actions", () => {
		it("startTimer starts the timer", async () => {
			vi.useFakeTimers();
			timerStore.remainingTime = 1500;

			await timerStore.startTimer();

			expect(timerStore.isRunning).toBe(true);

			// Advance time
			vi.advanceTimersByTime(1000);
			expect(timerStore.remainingTime).toBeLessThan(1500);
		});

		it("pauseTimer stops the timer", async () => {
			vi.useFakeTimers();
			await timerStore.startTimer();
			expect(timerStore.isRunning).toBe(true);

			timerStore.pauseTimer();
			expect(timerStore.isRunning).toBe(false);

			const timeAtPause = timerStore.remainingTime;
			vi.advanceTimersByTime(2000);
			expect(timerStore.remainingTime).toBe(timeAtPause);
		});

		it("resetTimer resets state", async () => {
			timerStore.remainingTime = 1000;
			timerStore.isRunning = true;

			await timerStore.resetTimer();

			expect(timerStore.isRunning).toBe(false);
			expect(timerStore.remainingTime).toBe(1500); // Back to full focus duration
		});

		it("skip switches modes", () => {
			// Focus -> Rest
			timerStore.mode = TimerMode.FOCUS;
			timerStore.sessionStreak = 0;

			timerStore.skip();

			expect(timerStore.mode).toBe(TimerMode.REST);
			expect(timerStore.sessionStreak).toBe(1);
			expect(timerStore.remainingTime).toBe(300); // 5 min short break

			// Rest -> Focus
			timerStore.skip();

			expect(timerStore.mode).toBe(TimerMode.FOCUS);
			expect(timerStore.remainingTime).toBe(1500);
		});

		it("skip handles long break", () => {
			timerStore.mode = TimerMode.FOCUS;
			timerStore.sessionStreak = 3; // Next one makes it 4 (long break interval)

			timerStore.skip();

			expect(timerStore.mode).toBe(TimerMode.REST);
			expect(timerStore.sessionStreak).toBe(4);
			expect(timerStore.remainingTime).toBe(900); // 15 min long break
		});

		it("setCategoryId updates category", () => {
			timerStore.setCategoryId(123);
			expect(timerStore.categoryId).toBe(123);

			timerStore.setCategoryId(null);
			expect(timerStore.categoryId).toBeNull();
		});
	});

	describe("Timer Logic", () => {
		it("completes session and switches to break", async () => {
			vi.useFakeTimers();
			timerStore.mode = TimerMode.FOCUS;
			timerStore.remainingTime = 1; // 1 second left
			timerStore.isRunning = true;

			// Reset to ensure clean state
			timerStore.pauseTimer();
			timerStore.remainingTime = 0.1; // Very small

			await timerStore.startTimer();

			// Advance enough to finish
			vi.advanceTimersByTime(200);

			// Wait for async handleComplete
			// handleComplete is async but doesn't have timers inside it (except startTimer if auto-start)
			// But here auto-start is false (default mock)
			await Promise.resolve(); // flush microtasks

			expect(timerStore.mode).toBe(TimerMode.REST);
			expect(timerStore.isRunning).toBe(false); // Auto start is false by default
			expect(timerStore.remainingTime).toBe(300);
		});

		it("auto-starts break if enabled", async () => {
			// Update settings
			const autoStartSetting = settingsStore.settings.find(
				(s) => s.key === "Auto Start Break"
			);
			if (autoStartSetting) autoStartSetting.value = "true";

			vi.useFakeTimers();
			timerStore.remainingTime = 0.1;

			await timerStore.startTimer();

			// Advance to finish current timer
			vi.advanceTimersByTime(200);

			// Flush microtasks for handleComplete
			await Promise.resolve();

			expect(timerStore.mode).toBe(TimerMode.REST);
			expect(timerStore.isRunning).toBe(true);

			// Verify new timer is running
			const timeAtStart = timerStore.remainingTime;
			vi.advanceTimersByTime(1000);
			expect(timerStore.remainingTime).toBeLessThan(timeAtStart);
		});

		it("completes session and triggers long break", async () => {
			vi.useFakeTimers();
			timerStore.mode = TimerMode.FOCUS;
			timerStore.sessionStreak = 3; // Next one makes it 4 (long break interval)
			timerStore.remainingTime = 0.1;

			await timerStore.startTimer();

			// Advance to finish current timer
			vi.advanceTimersByTime(200);

			// Flush microtasks
			await Promise.resolve();

			expect(timerStore.mode).toBe(TimerMode.REST);
			expect(timerStore.remainingTime).toBe(900); // 15 min long break
			expect(timerStore.sessionStreak).toBe(4);
		});

		it("resets streak after long break completes", async () => {
			vi.useFakeTimers();
			timerStore.mode = TimerMode.REST;
			timerStore.sessionStreak = 4; // Long break active
			timerStore.remainingTime = 0.1;

			await timerStore.startTimer();

			// Advance to finish current timer
			vi.advanceTimersByTime(200);
			await Promise.resolve();

			expect(timerStore.mode).toBe(TimerMode.FOCUS);
			expect(timerStore.sessionStreak).toBe(0);
		});

		it("resets streak after long break skipped", () => {
			timerStore.mode = TimerMode.REST;
			timerStore.sessionStreak = 4; // Long break active

			timerStore.skip();

			expect(timerStore.mode).toBe(TimerMode.FOCUS);
			expect(timerStore.sessionStreak).toBe(0);
		});

		it("auto-starts focus if enabled", async () => {
			// Update settings to enable auto-start focus
			const autoStartSetting = settingsStore.settings.find(
				(s) => s.key === "Auto Start Focus"
			);
			if (autoStartSetting) autoStartSetting.value = "true";

			vi.useFakeTimers();
			timerStore.mode = TimerMode.REST;
			timerStore.remainingTime = 0.1;

			await timerStore.startTimer();

			// Advance to finish current timer
			vi.advanceTimersByTime(200);

			// Flush microtasks for handleComplete
			await Promise.resolve();

			expect(timerStore.mode).toBe(TimerMode.FOCUS);
			expect(timerStore.isRunning).toBe(true);

			// Verify new timer is running
			const timeAtStart = timerStore.remainingTime;
			vi.advanceTimersByTime(1000);
			expect(timerStore.remainingTime).toBeLessThan(timeAtStart);
		});
	});

	describe("Database Integration", () => {
		it("creates session when starting with category", async () => {
			const { add_session } = await import("../../funcs/db/session");

			vi.useFakeTimers();
			timerStore.mode = TimerMode.FOCUS;
			timerStore.remainingTime = 1500; // Full focus duration
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

		it("does not create session when category is null", async () => {
			const { add_session } = await import("../../funcs/db/session");

			vi.useFakeTimers();
			vi.clearAllMocks();

			timerStore.mode = TimerMode.FOCUS;
			timerStore.remainingTime = 1500; // Full focus duration
			timerStore.setCategoryId(null);

			await timerStore.startTimer();

			expect(add_session).not.toHaveBeenCalled();
		});
	});

	describe("Additional Actions", () => {
		it("toggleTimer toggles from paused to running", async () => {
			vi.useFakeTimers();
			timerStore.isRunning = false;
			timerStore.remainingTime = 1500;

			await timerStore.toggleTimer();

			expect(timerStore.isRunning).toBe(true);
		});

		it("toggleTimer toggles from running to paused", async () => {
			vi.useFakeTimers();
			await timerStore.startTimer();
			expect(timerStore.isRunning).toBe(true);

			timerStore.toggleTimer();

			expect(timerStore.isRunning).toBe(false);
		});

		it("resetTimer resets in REST mode (short break)", async () => {
			timerStore.mode = TimerMode.REST;
			timerStore.sessionStreak = 2; // Not at long break interval
			timerStore.remainingTime = 100;

			await timerStore.resetTimer();

			expect(timerStore.isRunning).toBe(false);
			expect(timerStore.remainingTime).toBe(300); // Short break duration
		});

		it("resetTimer resets in REST mode (long break)", async () => {
			timerStore.mode = TimerMode.REST;
			timerStore.sessionStreak = 4; // At long break interval
			timerStore.remainingTime = 100;

			await timerStore.resetTimer();

			expect(timerStore.isRunning).toBe(false);
			expect(timerStore.remainingTime).toBe(900); // Long break duration
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
			timerStore.sessionStreak = 2; // Not at long break
			timerStore.isRunning = false;

			// Change short break setting
			const shortBreakSetting = settingsStore.settings.find(
				(s) => s.key === "Short Break Time"
			);
			if (shortBreakSetting) {
				shortBreakSetting.value = "10"; // Change from 5 to 10 minutes
			}

			// Trigger watcher by waiting for next tick
			await Promise.resolve();
			await Promise.resolve();

			expect(timerStore.remainingTime).toBe(600); // 10 minutes in seconds
		});

		it("updates remainingTime when settings change in REST mode (long break)", async () => {
			timerStore.mode = TimerMode.REST;
			timerStore.sessionStreak = 4; // At long break interval
			timerStore.isRunning = false;

			// Change long break setting
			const longBreakSetting = settingsStore.settings.find(
				(s) => s.key === "Long Break Time"
			);
			if (longBreakSetting) {
				longBreakSetting.value = "20"; // Change from 15 to 20 minutes
			}

			// Trigger watcher by waiting for next tick
			await Promise.resolve();
			await Promise.resolve();

			expect(timerStore.remainingTime).toBe(1200); // 20 minutes in seconds
		});
	});
});
