import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecurrenceType } from "../../defines/recur";
import type { Task } from "../../defines/task";
import { useTasks } from "../task";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

describe("Tasks Store - Expansion", () => {
	let tasksStore: ReturnType<typeof useTasks>;

	beforeEach(() => {
		setActivePinia(createPinia());
		tasksStore = useTasks();
	});

	describe("expandTasksForRange", () => {
		const today = new Date();
		today.setHours(12, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const nextWeek = new Date(today);
		nextWeek.setDate(nextWeek.getDate() + 7);

		it("expands non-recurring tasks within range", () => {
			const task: Task = {
				id: 1,
				title: "Test Task",
				category: null,
				category_id: null,
				project_id: null,
				cycles: 1,
				startTime: today,
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red",
				recurrence: { type: RecurrenceType.NONE },
				completedCycles: 0
			};
			tasksStore.tasks = [task];
			tasksStore.expandTasksForRange(yesterday, tomorrow);
			expect(tasksStore.expandedTasks).toHaveLength(1);
			expect(tasksStore.expandedTasks[0].id).toBe(1);
		});

		it("excludes non-recurring tasks outside range", () => {
			const task: Task = {
				id: 1,
				title: "Past Task",
				category: null,
				category_id: null,
				project_id: null,
				cycles: 1,
				startTime: new Date("2020-01-01"),
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red",
				recurrence: { type: RecurrenceType.NONE },
				completedCycles: 0
			};
			tasksStore.tasks = [task];
			tasksStore.expandTasksForRange(yesterday, tomorrow);
			expect(tasksStore.expandedTasks).toHaveLength(0);
		});

		it("expands daily recurring tasks to multiple dates", () => {
			const startDate = new Date(today);
			startDate.setDate(startDate.getDate() - 2);
			const task: Task = {
				id: 1,
				title: "Daily Task",
				category: null,
				category_id: null,
				project_id: null,
				cycles: 1,
				startTime: startDate,
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red",
				recurrence_rule: "FREQ=DAILY",
				completedCycles: 0
			};
			tasksStore.tasks = [task];
			tasksStore.expandTasksForRange(yesterday, nextWeek);
			expect(tasksStore.expandedTasks.length).toBeGreaterThan(1);
			tasksStore.expandedTasks.forEach((t) => {
				expect(t.id).toBe(1);
			});
		});

		it("expands weekly recurring tasks correctly", () => {
			const startDate = new Date(today);
			startDate.setDate(startDate.getDate() - 14);
			const task: Task = {
				id: 2,
				title: "Weekly Task",
				category: null,
				category_id: null,
				project_id: null,
				cycles: 1,
				startTime: startDate,
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red",
				recurrence_rule: "FREQ=WEEKLY",
				completedCycles: 0
			};
			const endDate = new Date(today);
			endDate.setDate(endDate.getDate() + 14);
			tasksStore.tasks = [task];
			tasksStore.expandTasksForRange(yesterday, endDate);
			expect(tasksStore.expandedTasks.length).toBeGreaterThanOrEqual(2);
		});

		it("sorts expanded tasks by startTime", () => {
			const laterTask: Task = {
				id: 1,
				title: "Later",
				category: null,
				category_id: null,
				project_id: null,
				cycles: 1,
				startTime: tomorrow,
				completed: false,
				gradient: "",
				completedCycles: 0
			};
			const earlierTask: Task = {
				id: 2,
				title: "Earlier",
				category: null,
				category_id: null,
				project_id: null,
				cycles: 1,
				startTime: today,
				completed: false,
				gradient: "",
				completedCycles: 0
			};
			tasksStore.tasks = [laterTask, earlierTask];
			tasksStore.expandTasksForRange(yesterday, nextWeek);
			expect(tasksStore.expandedTasks[0].id).toBe(2);
			expect(tasksStore.expandedTasks[1].id).toBe(1);
		});

		it("excludes completed exception instances from recurring tasks", () => {
			const parentTask: Task = {
				id: 1,
				title: "Daily Task",
				category: null,
				category_id: null,
				project_id: null,
				cycles: 1,
				startTime: yesterday,
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red",
				recurrence_rule: "FREQ=DAILY",
				completedCycles: 0
			};
			const exceptionTask: Task = {
				id: 2,
				title: "Daily Task",
				category: null,
				category_id: null,
				project_id: null,
				cycles: 1,
				startTime: today,
				completed: true,
				gradient: "from-pomodo-orange to-pomodo-red",
				parent_task_id: 1,
				completedCycles: 0
			};
			tasksStore.tasks = [parentTask, exceptionTask];
			tasksStore.expandTasksForRange(yesterday, tomorrow);
			const todayOccurrences = tasksStore.expandedTasks.filter(
				(t) =>
					t.id === 1 &&
					Math.abs(t.startTime.getTime() - today.getTime()) < 60000
			);
			expect(todayOccurrences).toHaveLength(0);
		});

		it("handles invalid recurrence rules gracefully", () => {
			const task: Task = {
				id: 1,
				title: "Bad Rule",
				category: null,
				category_id: null,
				project_id: null,
				cycles: 1,
				startTime: today,
				completed: false,
				gradient: "",
				recurrence_rule: "INVALID_RULE",
				completedCycles: 0
			};
			tasksStore.tasks = [task];
			expect(() =>
				tasksStore.expandTasksForRange(yesterday, tomorrow)
			).not.toThrow();
			expect(tasksStore.expandedTasks).toHaveLength(1);
		});

		it("includes completed non-recurring tasks", () => {
			const task: Task = {
				id: 1,
				title: "Done",
				category: null,
				category_id: null,
				project_id: null,
				cycles: 1,
				startTime: today,
				completed: true,
				gradient: "",
				completedCycles: 0
			};
			tasksStore.tasks = [task];
			tasksStore.expandTasksForRange(yesterday, tomorrow);
			expect(tasksStore.expandedTasks).toHaveLength(1);
			expect(tasksStore.expandedTasks[0].id).toBe(1);
		});
	});
});
