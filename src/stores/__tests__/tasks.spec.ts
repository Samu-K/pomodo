import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecurrenceType } from "../../defines/recur";
import type { Task } from "../../defines/task";
import { useTasks } from "../task";
import { useUIStore } from "../ui";

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn()
}));

// Mock the task functions
vi.mock("../../funcs/task", () => ({
	getRecurrenceString: vi.fn(() => undefined)
}));

describe("Tasks Store", () => {
	let tasksStore: ReturnType<typeof useTasks>;
	let uiStore: ReturnType<typeof useUIStore>;

	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
		tasksStore = useTasks();
		uiStore = useUIStore();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Initial State", () => {
		it("initializes with empty tasks array", () => {
			expect(tasksStore.tasks).toEqual([]);
		});

		it("initializes with empty expandedTasks array", () => {
			expect(tasksStore.expandedTasks).toEqual([]);
		});
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
				cycles: 1,
				startTime: today,
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red",
				recurrence: { type: RecurrenceType.NONE }
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
				cycles: 1,
				startTime: new Date("2020-01-01"),
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red",
				recurrence: { type: RecurrenceType.NONE }
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
				cycles: 1,
				startTime: startDate,
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red",
				recurrence_rule: "FREQ=DAILY"
			};

			tasksStore.tasks = [task];
			tasksStore.expandTasksForRange(yesterday, nextWeek);

			// Should have multiple occurrences
			expect(tasksStore.expandedTasks.length).toBeGreaterThan(1);
			// All should have the same task id
			tasksStore.expandedTasks.forEach((t) => {
				expect(t.id).toBe(1);
			});
		});

		it("expands weekly recurring tasks correctly", () => {
			const startDate = new Date(today);
			startDate.setDate(startDate.getDate() - 14); // Start 2 weeks ago

			const task: Task = {
				id: 2,
				title: "Weekly Task",
				category: null,
				category_id: null,
				cycles: 1,
				startTime: startDate,
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red",
				recurrence_rule: "FREQ=WEEKLY"
			};

			const endDate = new Date(today);
			endDate.setDate(endDate.getDate() + 14);

			tasksStore.tasks = [task];
			tasksStore.expandTasksForRange(yesterday, endDate);

			// Should have at least 2 occurrences (this week and next)
			expect(tasksStore.expandedTasks.length).toBeGreaterThanOrEqual(2);
		});

		it("sorts expanded tasks by startTime", () => {
			const laterTask: Task = {
				id: 1,
				title: "Later Task",
				category: null,
				category_id: null,
				cycles: 1,
				startTime: tomorrow,
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red"
			};

			const earlierTask: Task = {
				id: 2,
				title: "Earlier Task",
				category: null,
				category_id: null,
				cycles: 1,
				startTime: today,
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red"
			};

			tasksStore.tasks = [laterTask, earlierTask];
			tasksStore.expandTasksForRange(yesterday, nextWeek);

			expect(tasksStore.expandedTasks[0].id).toBe(2); // Earlier
			expect(tasksStore.expandedTasks[1].id).toBe(1); // Later
		});

		it("excludes completed exception instances from recurring tasks", () => {
			const parentTask: Task = {
				id: 1,
				title: "Daily Task",
				category: null,
				category_id: null,
				cycles: 1,
				startTime: yesterday,
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red",
				recurrence_rule: "FREQ=DAILY"
			};

			// Exception for today's instance
			const exceptionTask: Task = {
				id: 2,
				title: "Daily Task",
				category: null,
				category_id: null,
				cycles: 1,
				startTime: today,
				completed: true,
				gradient: "from-pomodo-orange to-pomodo-red",
				parent_task_id: 1
			};

			tasksStore.tasks = [parentTask, exceptionTask];
			tasksStore.expandTasksForRange(yesterday, tomorrow);

			// Should not include today's occurrence (it's an exception)
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
				title: "Bad Rule Task",
				category: null,
				category_id: null,
				cycles: 1,
				startTime: today,
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red",
				recurrence_rule: "INVALID_RULE"
			};

			tasksStore.tasks = [task];

			// Should not throw
			expect(() =>
				tasksStore.expandTasksForRange(yesterday, tomorrow)
			).not.toThrow();

			// Should include the original task as fallback
			expect(tasksStore.expandedTasks).toHaveLength(1);
		});

		it("excludes completed non-recurring tasks", () => {
			const task: Task = {
				id: 1,
				title: "Completed Task",
				category: null,
				category_id: null,
				cycles: 1,
				startTime: today,
				completed: true,

				gradient: "from-pomodo-orange to-pomodo-red"
			};

			tasksStore.tasks = [task];
			tasksStore.expandTasksForRange(yesterday, tomorrow);

			expect(tasksStore.expandedTasks).toHaveLength(0);
		});
	});

	describe("fetchTasks", () => {
		it("fetches and transforms tasks from database", async () => {
			const { invoke } = await import("@tauri-apps/api/core");

			vi.mocked(invoke).mockImplementation(async (cmd: string) => {
				if (cmd === "tasks_get_tasks") {
					return [
						{
							id: 1,
							title: "Test Task",
							category_id: 1,
							estimated_pomodoros: 3,
							start_datetime: "2024-03-15T10:00:00",
							recurrence_rule: null,
							is_completed: false,
							parent_task_id: null,
							created_at: null
						}
					];
				}
				if (cmd === "categories_get_categories") {
					return [{ id: 1, name: "Work" }];
				}
				return [];
			});

			await tasksStore.fetchTasks();

			expect(tasksStore.tasks).toHaveLength(1);
			expect(tasksStore.tasks[0]).toMatchObject({
				id: 1,
				title: "Test Task",
				category: "Work",
				category_id: 1,
				cycles: 3,
				completed: false
			});
		});

		it("handles missing category gracefully", async () => {
			const { invoke } = await import("@tauri-apps/api/core");

			vi.mocked(invoke).mockImplementation(async (cmd: string) => {
				if (cmd === "tasks_get_tasks") {
					return [
						{
							id: 1,
							title: "Orphan Task",
							category_id: 999, // Non-existent
							estimated_pomodoros: 1,
							start_datetime: "2024-03-15T10:00:00",
							recurrence_rule: null,
							is_completed: false,
							parent_task_id: null,
							created_at: null
						}
					];
				}
				if (cmd === "categories_get_categories") {
					return []; // No categories
				}
				return [];
			});

			await tasksStore.fetchTasks();

			expect(tasksStore.tasks).toHaveLength(1);
			expect(tasksStore.tasks[0].category).toBe("");
		});

		it("handles fetch error gracefully and sets ui store error", async () => {
			const { invoke } = await import("@tauri-apps/api/core");

			vi.mocked(invoke).mockRejectedValue(new Error("DB Error"));

			await tasksStore.fetchTasks();

			expect(uiStore.errorMessage).toBe("DB Error");
		});
	});

	describe("addTask", () => {
		it("calls invoke with correct payload", async () => {
			const { invoke } = await import("@tauri-apps/api/core");

			vi.mocked(invoke).mockImplementation(async (cmd: string) => {
				if (cmd === "tasks_get_tasks") return [];
				if (cmd === "categories_get_categories") return [];
				if (cmd === "tasks_add_task") return 1;
				return [];
			});

			const newTask: Task = {
				id: 0,
				title: "New Task",
				category: null,
				category_id: null,
				cycles: 2,
				startTime: new Date("2024-03-15T10:00:00Z"),
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red",
				recurrence: { type: RecurrenceType.NONE }
			};

			await tasksStore.addTask(newTask);

			expect(invoke).toHaveBeenCalledWith("tasks_add_task", {
				task: expect.objectContaining({
					title: "New Task",
					estimated_pomodoros: 2,
					is_completed: false
				})
			});
		});

		it("creates new category if not found", async () => {
			const { invoke } = await import("@tauri-apps/api/core");

			vi.mocked(invoke).mockImplementation(async (cmd: string, _args?: any) => {
				if (cmd === "tasks_get_tasks") return [];
				if (cmd === "categories_get_categories") return [];
				if (cmd === "categories_add_category") return 42;
				if (cmd === "tasks_add_task") return 1;
				return [];
			});

			const newTask: Task = {
				id: 0,
				title: "Task With New Category",
				category: "New Category",
				category_id: null,
				cycles: 1,
				startTime: new Date("2024-03-15T10:00:00Z"),
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red"
			};

			await tasksStore.addTask(newTask);

			expect(invoke).toHaveBeenCalledWith("categories_add_category", {
				cat: { id: 0, name: "New Category", color: "pomodo-orange" }
			});
		});

		it("uses existing category if found", async () => {
			const { invoke } = await import("@tauri-apps/api/core");

			vi.mocked(invoke).mockImplementation(async (cmd: string) => {
				if (cmd === "tasks_get_tasks") return [];
				if (cmd === "categories_get_categories") {
					return [{ id: 5, name: "Existing Category" }];
				}
				if (cmd === "tasks_add_task") return 1;
				return [];
			});

			const newTask: Task = {
				id: 0,
				title: "Task With Existing Category",
				category: "Existing Category",
				category_id: null,
				cycles: 1,
				startTime: new Date("2024-03-15T10:00:00Z"),
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red"
			};

			await tasksStore.addTask(newTask);

			expect(invoke).toHaveBeenCalledWith("tasks_add_task", {
				task: expect.objectContaining({
					category_id: 5
				})
			});
		});
	});

	describe("updateTask", () => {
		it("updates task with correct payload", async () => {
			const { invoke } = await import("@tauri-apps/api/core");

			vi.mocked(invoke).mockImplementation(async (cmd: string) => {
				if (cmd === "tasks_get_tasks") return [];
				if (cmd === "categories_get_categories") return [];
				if (cmd === "tasks_update_task") return undefined;
				return [];
			});

			const task: Task = {
				id: 5,
				title: "Updated Task",
				category: null,
				category_id: 1,
				cycles: 3,
				startTime: new Date("2024-03-15T10:00:00Z"),
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red",
				recurrence_rule: "FREQ=DAILY"
			};

			await tasksStore.updateTask(task, false);

			expect(invoke).toHaveBeenCalledWith("tasks_update_task", {
				task: expect.objectContaining({
					id: 5,
					title: "Updated Task",
					category_id: 1,
					estimated_pomodoros: 3,
					recurrence_rule: "FREQ=DAILY"
				})
			});
		});

		it("regenerates recurrence rule when recurrenceChanged is true", async () => {
			const { invoke } = await import("@tauri-apps/api/core");
			const { getRecurrenceString } = await import("../../funcs/task");

			vi.mocked(getRecurrenceString).mockReturnValue("FREQ=WEEKLY");
			vi.mocked(invoke).mockImplementation(async (cmd: string) => {
				if (cmd === "tasks_get_tasks") return [];
				if (cmd === "categories_get_categories") return [];
				if (cmd === "tasks_update_task") return undefined;
				return [];
			});

			const task: Task = {
				id: 5,
				title: "Updated Task",
				category: null,
				category_id: 1,
				cycles: 1,
				startTime: new Date("2024-03-15T10:00:00Z"),
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red",
				recurrence: {
					type: RecurrenceType.WEEKLY,
					repeatUntilType: import("../../defines/recur").then(
						(m) => m.RepeatUntilType.REPEAT_FOREVER
					)
				} as any
			};

			await tasksStore.updateTask(task, true);

			expect(getRecurrenceString).toHaveBeenCalledWith(task);
		});
	});

	describe("deleteTask", () => {
		it("deletes task and refreshes list", async () => {
			const { invoke } = await import("@tauri-apps/api/core");

			vi.mocked(invoke).mockImplementation(async (cmd: string) => {
				if (cmd === "tasks_get_tasks") return [];
				if (cmd === "categories_get_categories") return [];
				if (cmd === "tasks_delete_task") return undefined;
				return [];
			});

			await tasksStore.deleteTask(5);

			expect(invoke).toHaveBeenCalledWith("tasks_delete_task", { id: 5 });
			// Should also fetch tasks after delete
			expect(invoke).toHaveBeenCalledWith("tasks_get_tasks");
		});

		it("handles delete error gracefully and sets ui store error", async () => {
			const { invoke } = await import("@tauri-apps/api/core");

			vi.mocked(invoke).mockRejectedValue(new Error("Delete failed"));

			await tasksStore.deleteTask(5);

			expect(uiStore.errorMessage).toBe("Delete failed");
		});
	});

	describe("completeTaskInstance", () => {
		beforeEach(async () => {
			const { invoke } = await import("@tauri-apps/api/core");
			vi.mocked(invoke).mockImplementation(async (cmd: string) => {
				if (cmd === "tasks_get_tasks") return [];
				if (cmd === "categories_get_categories") return [];
				return undefined;
			});
		});

		it("completes recurring task instance via special command", async () => {
			const { invoke } = await import("@tauri-apps/api/core");

			const task: Task = {
				id: 1,
				title: "Recurring Task",
				category: null,
				category_id: null,
				cycles: 1,
				startTime: new Date("2024-03-15T10:00:00Z"),
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red",
				recurrence_rule: "FREQ=DAILY"
				// No parent_task_id - this is the parent
			};

			await tasksStore.completeTaskInstance(task);

			expect(invoke).toHaveBeenCalledWith("tasks_complete_task_instance", {
				parentTaskId: 1,
				date: "2024-03-15T10:00:00"
			});
		});

		it("completes non-recurring task via update", async () => {
			const { invoke } = await import("@tauri-apps/api/core");

			const task: Task = {
				id: 1,
				title: "Single Task",
				category: null,
				category_id: null,
				cycles: 1,
				startTime: new Date("2024-03-15T10:00:00Z"),
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red"
				// No recurrence_rule
			};

			await tasksStore.completeTaskInstance(task);

			expect(invoke).toHaveBeenCalledWith("tasks_update_task", {
				task: expect.objectContaining({
					id: 1,
					is_completed: true
				})
			});
		});

		it("completes exception task (child of recurring) via update", async () => {
			const { invoke } = await import("@tauri-apps/api/core");

			const task: Task = {
				id: 2,
				title: "Exception Task",
				category: null,
				category_id: null,
				cycles: 1,
				startTime: new Date("2024-03-15T10:00:00Z"),
				completed: false,
				gradient: "from-pomodo-orange to-pomodo-red",
				recurrence_rule: "FREQ=DAILY",
				parent_task_id: 1 // This is a child/exception
			};

			await tasksStore.completeTaskInstance(task);

			expect(invoke).toHaveBeenCalledWith("tasks_update_task", {
				task: expect.objectContaining({
					id: 2,
					is_completed: true,
					parent_task_id: 1
				})
			});
		});
	});
});
