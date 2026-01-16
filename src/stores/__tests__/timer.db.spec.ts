import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "../settings";
import { TimerMode, useTimerStore } from "../timer";

// Mock DB functions correctly
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
class MockWorker {
	postMessage() {}
	set onmessage(_: ((e: MessageEvent) => void) | null) {}
	terminate() {}
}
vi.stubGlobal("Worker", MockWorker);

describe("Timer Store DB Integration", () => {
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
			}
		];
		settingsStore.isLoading = false;
		settingsStore.fetchSettings = vi.fn();
		timerStore = useTimerStore();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("creates session when starting with category", async () => {
		const { add_session } = await import("../../funcs/db/session");
		vi.mocked(add_session).mockResolvedValue(123);

		timerStore.mode = TimerMode.FOCUS;
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

		timerStore.setCategoryId(42);
		await timerStore.startTimer();
		await timerStore.resetTimer();

		expect(delete_session).toHaveBeenCalledWith(123);
	});
});
