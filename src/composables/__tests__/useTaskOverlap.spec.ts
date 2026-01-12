import { describe, expect, it, vi } from "vitest";
import type { Task } from "../../defines/task";

// Mock the settings store before importing the composable
vi.mock("../../stores/settings", () => ({
	useSettingsStore: () => ({
		settings: [
			{ key: "Focus Duration", value: "25" },
			{ key: "Short Break Time", value: "5" },
			{ key: "Long Break Time", value: "15" },
			{ key: "Long Break Interval", value: "4" }
		]
	})
}));

// Import after mocking
import { useTaskOverlap } from "../useTaskOverlap";

describe("useTaskOverlap", () => {
	const baseTask: Omit<Task, "id" | "startTime" | "cycles"> = {
		title: "Base Task",
		category: null,
		category_id: null,
		project_id: null,
		completed: false,
		completedCycles: 0,
		gradient: ""
	};

	const createTask = (
		id: number,
		startTime: Date,
		cycles: number,
		title = "Test Task"
	): Task => ({
		...baseTask,
		id,
		title,
		startTime,
		cycles
	});

	describe("checkForOverlap", () => {
		it("returns null when no existing tasks", () => {
			const { checkForOverlap } = useTaskOverlap();
			const newTask = createTask(0, new Date("2026-01-12T14:00:00"), 2);

			const result = checkForOverlap(newTask, []);

			expect(result).toBeNull();
		});

		it("returns null when tasks do not overlap", () => {
			const { checkForOverlap } = useTaskOverlap();
			const newTask = createTask(0, new Date("2026-01-12T14:00:00"), 1); // 14:00-14:25
			const existingTask = createTask(1, new Date("2026-01-12T15:00:00"), 1); // 15:00-15:25

			const result = checkForOverlap(newTask, [existingTask]);

			expect(result).toBeNull();
		});

		it("detects overlap when new task starts during existing task", () => {
			const { checkForOverlap } = useTaskOverlap();
			// Existing: 14:00 - ~14:55 (2 cycles = 25 + 5 + 25 = 55 min)
			const existingTask = createTask(
				1,
				new Date("2026-01-12T14:00:00"),
				2,
				"Existing Task"
			);
			// New: 14:30 - ~14:55 (1 cycle = 25 min)
			const newTask = createTask(0, new Date("2026-01-12T14:30:00"), 1);

			const result = checkForOverlap(newTask, [existingTask]);

			expect(result).not.toBeNull();
			expect(result?.overlappingTask.id).toBe(1);
			expect(result?.overlappingTask.title).toBe("Existing Task");
		});

		it("detects overlap when new task ends during existing task", () => {
			const { checkForOverlap } = useTaskOverlap();
			// Existing: 14:00 - ~14:25 (1 cycle)
			const existingTask = createTask(
				1,
				new Date("2026-01-12T14:00:00"),
				1,
				"Existing Task"
			);
			// New: 13:30 - ~14:25 (2 cycles = 55 min)
			const newTask = createTask(0, new Date("2026-01-12T13:30:00"), 2);

			const result = checkForOverlap(newTask, [existingTask]);

			expect(result).not.toBeNull();
			expect(result?.overlappingTask.id).toBe(1);
		});

		it("detects overlap when new task completely contains existing task", () => {
			const { checkForOverlap } = useTaskOverlap();
			// Existing: 14:30 - ~14:55 (1 cycle)
			const existingTask = createTask(
				1,
				new Date("2026-01-12T14:30:00"),
				1,
				"Existing Task"
			);
			// New: 14:00 - ~15:25 (3 cycles = 25 + 5 + 25 + 5 + 25 = 85 min)
			const newTask = createTask(0, new Date("2026-01-12T14:00:00"), 3);

			const result = checkForOverlap(newTask, [existingTask]);

			expect(result).not.toBeNull();
			expect(result?.overlappingTask.id).toBe(1);
		});

		it("skips completed tasks", () => {
			const { checkForOverlap } = useTaskOverlap();
			const existingTask = createTask(1, new Date("2026-01-12T14:00:00"), 2);
			existingTask.completed = true;
			const newTask = createTask(0, new Date("2026-01-12T14:30:00"), 1);

			const result = checkForOverlap(newTask, [existingTask]);

			expect(result).toBeNull();
		});

		it("excludes specified task ID (for edit scenarios)", () => {
			const { checkForOverlap } = useTaskOverlap();
			const existingTask = createTask(5, new Date("2026-01-12T14:00:00"), 2);
			const newTask = createTask(5, new Date("2026-01-12T14:00:00"), 2);

			const result = checkForOverlap(newTask, [existingTask], 5);

			expect(result).toBeNull();
		});

		it("returns first overlapping task when multiple overlaps exist", () => {
			const { checkForOverlap } = useTaskOverlap();
			const existingTask1 = createTask(
				1,
				new Date("2026-01-12T14:00:00"),
				1,
				"First"
			);
			const existingTask2 = createTask(
				2,
				new Date("2026-01-12T14:10:00"),
				1,
				"Second"
			);
			// New task overlaps with both
			const newTask = createTask(0, new Date("2026-01-12T14:05:00"), 2);

			const result = checkForOverlap(newTask, [existingTask1, existingTask2]);

			expect(result).not.toBeNull();
			expect(result?.overlappingTask.title).toBe("First");
		});
	});

	describe("getTaskEndTime", () => {
		it("calculates correct end time for single cycle task", () => {
			const { getTaskEndTime } = useTaskOverlap();
			const task = createTask(1, new Date("2026-01-12T14:00:00"), 1);

			const endTime = getTaskEndTime(task);

			// 1 cycle = 25 minutes
			expect(endTime.getTime()).toBe(task.startTime.getTime() + 25 * 60 * 1000);
		});

		it("calculates correct end time for multi-cycle task", () => {
			const { getTaskEndTime } = useTaskOverlap();
			const task = createTask(1, new Date("2026-01-12T14:00:00"), 2);

			const endTime = getTaskEndTime(task);

			// 2 cycles = 25 + 5 (break) + 25 = 55 minutes
			expect(endTime.getTime()).toBe(task.startTime.getTime() + 55 * 60 * 1000);
		});
	});
});
