import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "../settings";
import { TimerMode, useTimerStore } from "../timer";

// Mock DB functions
vi.mock("../../funcs/db/sesssion", () => ({
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
			{ key: "Focus Duration", value: "25" },
			{ key: "Short Break Time", value: "5" },
			{ key: "Long Break Time", value: "15" },
			{ key: "Long Break Interval", value: "4" },
			{ key: "Auto Start Break", value: "false" },
			{ key: "Auto Start Focus", value: "false" }
		] as { key: string; value: string }[];
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
			expect(timerStore.sessionStreak).toBe(0);
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
			expect(timerStore.sessionStreak).toBe(0);
		});
	});
});
