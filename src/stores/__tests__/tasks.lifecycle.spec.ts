import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecurrenceType, RepeatUntilType } from "../../defines/recur";
import type { Task } from "../../defines/task";
import { useTasks } from "../task";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("../../funcs/task", () => ({
	getRecurrenceString: vi.fn(() => "FREQ=DAILY")
}));

describe("Tasks Store - Lifecycle", () => {
	let tasksStore: ReturnType<typeof useTasks>;

	beforeEach(() => {
		setActivePinia(createPinia());
		tasksStore = useTasks();
	});

	describe("updateTask", () => {
		it("updates task and triggers sync", async () => {
			const { invoke } = await import("@tauri-apps/api/core");
			vi.mocked(invoke).mockImplementation(async (cmd) => {
				if (cmd === "tasks_get_tasks" || cmd === "categories_get_categories")
					return [];
				return null;
			});
			const task: Task = {
				id: 5,
				title: "U",
				category: null,
				category_id: 1,
				project_id: null,
				cycles: 3,
				startTime: new Date(),
				completed: false,
				gradient: "",
				completedCycles: 0
			};
			await tasksStore.updateTask(task, false);
			expect(invoke).toHaveBeenCalledWith(
				"tasks_update_task",
				expect.anything()
			);
			expect(invoke).toHaveBeenCalledWith("ical_sync_ical");
		});

		it("regenerates recurrence rule if changed", async () => {
			const { getRecurrenceString } = await import("../../funcs/task");
			const task: Task = {
				id: 5,
				title: "U",
				category: null,
				category_id: 1,
				project_id: null,
				cycles: 1,
				startTime: new Date(),
				completed: false,
				gradient: "",
				recurrence: {
					type: RecurrenceType.DAILY,
					repeatUntilType: RepeatUntilType.REPEAT_FOREVER
				},
				completedCycles: 0
			};
			await tasksStore.updateTask(task, true);
			expect(getRecurrenceString).toHaveBeenCalled();
		});
	});

	describe("completeTaskInstance", () => {
		it("completes recurring task instance via special command", async () => {
			const { invoke } = await import("@tauri-apps/api/core");
			const task: Task = {
				id: 1,
				title: "R",
				category: null,
				category_id: null,
				project_id: null,
				cycles: 1,
				startTime: new Date("2024-03-15T10:00:00Z"),
				completed: false,
				gradient: "",
				recurrence_rule: "FREQ=DAILY",
				completedCycles: 0
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
				title: "S",
				category: null,
				category_id: null,
				project_id: null,
				cycles: 1,
				startTime: new Date(),
				completed: false,
				gradient: "",
				completedCycles: 0
			};
			await tasksStore.completeTaskInstance(task);
			expect(invoke).toHaveBeenCalledWith(
				"tasks_update_task",
				expect.objectContaining({
					task: expect.objectContaining({ is_completed: true })
				})
			);
		});
	});

	describe("syncICal", () => {
		it("calls ical_sync_ical command", async () => {
			const { invoke } = await import("@tauri-apps/api/core");
			await tasksStore.syncICal();
			expect(invoke).toHaveBeenCalledWith("ical_sync_ical");
		});
	});
});
