import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../../defines/task";
import { useTasks } from "../task";
import { useUIStore } from "../ui";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

describe("Tasks Store - CRUD", () => {
	let tasksStore: ReturnType<typeof useTasks>;
	let uiStore: ReturnType<typeof useUIStore>;

	beforeEach(() => {
		setActivePinia(createPinia());
		tasksStore = useTasks();
		uiStore = useUIStore();
	});

	describe("fetchTasks", () => {
		it("fetches and transforms tasks from database", async () => {
			const { invoke } = await import("@tauri-apps/api/core");
			vi.mocked(invoke).mockImplementation(async (cmd: string) => {
				if (cmd === "tasks_get_tasks") {
					return [
						{
							id: 1,
							title: "Test",
							category_id: 1,
							estimated_pomodoros: 3,
							start_datetime: "2024-03-15T10:00:00",
							is_completed: false
						}
					];
				}
				if (cmd === "categories_get_categories")
					return [{ id: 1, name: "Work" }];
				return [];
			});

			await tasksStore.fetchTasks();
			expect(tasksStore.tasks).toHaveLength(1);
			expect(tasksStore.tasks[0]).toMatchObject({
				id: 1,
				title: "Test",
				category: "Work"
			});
		});

		it("handles fetch error gracefully", async () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			const { invoke } = await import("@tauri-apps/api/core");
			vi.mocked(invoke).mockRejectedValue(new Error("DB Error"));
			await tasksStore.fetchTasks();
			expect(uiStore.errorMessage).toBe("DB Error");
		});
	});

	describe("addTask", () => {
		it("calls invoke with correct payload", async () => {
			const { invoke } = await import("@tauri-apps/api/core");
			vi.mocked(invoke).mockImplementation(async (cmd) => {
				if (cmd === "tasks_get_tasks" || cmd === "categories_get_categories")
					return [];
				return 1;
			});

			const newTask: Task = {
				id: 0,
				title: "New",
				category: null,
				category_id: null,
				project_id: null,
				cycles: 2,
				startTime: new Date(),
				completed: false,
				gradient: "",
				completedCycles: 0
			};

			await tasksStore.addTask(newTask);
			expect(invoke).toHaveBeenCalledWith("tasks_add_task", expect.anything());
			expect(invoke).toHaveBeenCalledWith("ical_sync_ical");
		});

		it("creates new category if not found", async () => {
			const { invoke } = await import("@tauri-apps/api/core");
			vi.mocked(invoke).mockImplementation(async (cmd: string) => {
				if (cmd === "categories_get_categories") return [];
				if (cmd === "tasks_get_tasks") return [];
				if (cmd === "categories_add_category") return 42;
				return 1;
			});

			const newTask: Task = {
				id: 0,
				title: "New",
				category: "New Cat",
				category_id: null,
				project_id: null,
				cycles: 1,
				startTime: new Date(),
				completed: false,
				gradient: "",
				completedCycles: 0
			};
			await tasksStore.addTask(newTask);
			expect(invoke).toHaveBeenCalledWith(
				"categories_add_category",
				expect.anything()
			);
		});
	});

	describe("deleteTask", () => {
		it("deletes task and refreshes list", async () => {
			const { invoke } = await import("@tauri-apps/api/core");
			vi.mocked(invoke).mockImplementation(async (cmd) => {
				if (cmd === "tasks_get_tasks") return []; // items after delete
				if (cmd === "categories_get_categories") return [];
				return undefined;
			});
			await tasksStore.deleteTask(5);
			expect(invoke).toHaveBeenCalledWith("tasks_delete_task", { id: 5 });
			expect(invoke).toHaveBeenCalledWith("tasks_get_tasks");
		});
	});
});
