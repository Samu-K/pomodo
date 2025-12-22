import { invoke } from "@tauri-apps/api/core";
import { defineStore } from "pinia";
import { RRule } from "rrule";
import { ref } from "vue";
import { RecurrenceType } from "../defines/recur";
import type { Task } from "../defines/task";
import type { Category } from "../funcs/commands";
import { getRecurrenceString } from "../funcs/task";

// Database schema for tasks (matches backend)
interface DatabaseTask {
	id: number;
	title: string;
	category_id: number | null;
	estimated_pomodoros: number | null;
	start_datetime: string | null;
	recurrence_rule: string | null;
	is_completed: boolean;
	parent_task_id: number | null;
	created_at: string | null;
}

export const useTasks = defineStore("tasks", () => {
	const tasks = ref<Task[]>([]);
	const expandedTasks = ref<Task[]>([]);

	async function fetchTasks() {
		try {
			const fetched = await invoke<DatabaseTask[]>("tasks_get_tasks");
			// Fetch categories to map names
			const categories = await invoke<Category[]>("categories_get_categories");
			const catMap = new Map(categories.map((c) => [c.id, c.name]));

			tasks.value = fetched.map((t) => ({
				id: t.id,
				title: t.title,
				category: t.category_id ? catMap.get(t.category_id) || "" : "",
				category_id: t.category_id,
				cycles: t.estimated_pomodoros || 1,
				startTime: t.start_datetime ? new Date(t.start_datetime) : new Date(),
				completed: t.is_completed,
				recurrence_rule: t.recurrence_rule ?? undefined,
				recurrence: { type: RecurrenceType.NONE }, // Default recurrence for UI compatibility
				gradient: "from-pomodo-orange to-pomodo-red",
				parent_task_id: t.parent_task_id ?? undefined
			}));

			expandTasksForRange(
				new Date(),
				new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
			);
		} catch (e) {
			console.error("Failed to fetch tasks", e);
		}
	}

	async function addTask(task: Task) {
		// Resolve category
		let categoryId = task.category_id;
		if (!categoryId && task.category) {
			try {
				// Try to find category by name (requires backend command or fetching all)
				// Let's assume we can fetch all and find
				const cats = await invoke<Category[]>("categories_get_categories");
				const existing = cats.find((c) => c.name === task.category);
				if (existing) {
					categoryId = existing.id;
				} else {
					// Create new
					categoryId = (await invoke("categories_add_category", {
						cat: { id: 0, name: task.category }
					})) as number;
				}
			} catch (e) {
				console.error("Error resolving category", e);
			}
		}

		const rrule = getRecurrenceString(task);

		const payload = {
			id: 0,
			title: task.title,
			category_id: categoryId,
			estimated_pomodoros: task.cycles,
			start_datetime: task.startTime.toISOString().slice(0, 19),
			recurrence_rule: rrule,
			is_completed: false,
			parent_task_id: null,
			created_at: null
		};

		await invoke("tasks_add_task", { task: payload });
		await fetchTasks();
	}

	async function updateTask(task: Task, recurrenceChanged: boolean) {
		// Resolve category if changed (naive implementation for now)
		const categoryId = task.category_id;
		// Logic to create category if needed ... (reused from addTask or extracted)

		let rrule = task.recurrence_rule;
		if (recurrenceChanged) {
			const rule = getRecurrenceString(task);
			rrule = rule !== undefined ? rule : undefined;
		}

		const payload = {
			id: task.id,
			title: task.title,
			category_id: categoryId,
			estimated_pomodoros: task.cycles,
			start_datetime: task.startTime.toISOString().slice(0, 19),
			recurrence_rule: rrule,
			is_completed: task.completed,
			parent_task_id: task.parent_task_id
		};

		await invoke("tasks_update_task", { task: payload });
		await fetchTasks();
	}

	async function completeTaskInstance(task: Task) {
		if (task.recurrence_rule && !task.parent_task_id) {
			await invoke("tasks_complete_task_instance", {
				parentTaskId: task.id,
				date: task.startTime.toISOString().slice(0, 19)
			});
		} else {
			const payload = {
				id: task.id,
				title: task.title,
				category_id: task.category_id,
				estimated_pomodoros: task.cycles,
				start_datetime: task.startTime.toISOString().slice(0, 19),
				recurrence_rule: task.recurrence_rule,
				is_completed: true,
				parent_task_id: task.parent_task_id
			};
			await invoke("tasks_update_task", { task: payload });
		}
		await fetchTasks();
	}

	function expandTasksForRange(start: Date, end: Date) {
		const expanded: Task[] = [];
		const exceptions = tasks.value.filter(
			(t) => t.parent_task_id !== null && t.parent_task_id !== undefined
		);

		tasks.value.forEach((t) => {
			if (t.is_completed && !t.recurrence_rule) return;

			if (t.recurrence_rule) {
				try {
					const options = RRule.parseString(t.recurrence_rule);
					options.dtstart = new Date(t.startTime); // Force checks relative to task start time

					const ruleWithStart = new RRule(options);
					const dates = ruleWithStart.between(start, end, true);

					dates.forEach((date) => {
						const isException = exceptions.some(
							(ex) =>
								ex.parent_task_id === t.id &&
								Math.abs(ex.startTime.getTime() - date.getTime()) < 60000
						);

						if (!isException) {
							expanded.push({
								...t,
								startTime: date
							});
						}
					});
				} catch (e) {
					console.error("Error parsing rule", e);
					expanded.push(t);
				}
			} else {
				if (t.startTime >= start && t.startTime <= end) {
					expanded.push(t);
				}
			}
		});

		expanded.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
		expandedTasks.value = expanded;
	}

	async function deleteTask(id: number) {
		try {
			await invoke("tasks_delete_task", { id });
			await fetchTasks();
		} catch (e) {
			console.error("Failed to delete task", e);
		}
	}

	return {
		tasks,
		expandedTasks,
		fetchTasks,
		addTask,
		updateTask,
		deleteTask,
		completeTaskInstance,
		expandTasksForRange
	};
});
