import { defineStore } from "pinia";
import { RRule } from "rrule";
import { ref } from "vue";
import { RecurrenceType } from "../defines/recur";
import type { Task } from "../defines/task";
import { commands } from "../funcs/commands";
import * as db from "../funcs/db/tasks";
import { fromUTCString, toUTCISOString } from "../funcs/stats/date_handling";
import { getRecurrenceString } from "../funcs/task";
import { useUIStore } from "./ui";

export const useTasks = defineStore("tasks", () => {
	const tasks = ref<Task[]>([]);
	const expandedTasks = ref<Task[]>([]);

	const ui = useUIStore();

	async function fetchTasks() {
		try {
			const failedRes = await commands.tasksGetTasks();
			if (failedRes.status === "error")
				throw new Error(failedRes.error.message);
			const fetched = failedRes.data;

			// Fetch categories to map names
			const catRes = await commands.categoriesGetCategories();
			if (catRes.status === "error") throw new Error(catRes.error.message);
			const categories = catRes.data;
			const catMap = new Map(categories.map((c) => [c.id, c.name]));

			tasks.value = fetched.map((t) => ({
				id: t.id,
				title: t.title,
				description: t.description ?? "",
				category: t.category_id ? catMap.get(t.category_id) || "" : "",
				category_id: t.category_id,
				project_id: t.project_id,
				cycles: t.estimated_pomodoros || 1,
				completedCycles: t.completed_pomodoros ?? 0,
				startTime: fromUTCString(t.start_datetime),
				completed: t.is_completed,
				recurrence_rule: t.recurrence_rule ?? undefined,
				recurrence: { type: RecurrenceType.NONE }, // Default recurrence for UI compatibility
				gradient: "from-pomodo-orange to-pomodo-red",
				parent_task_id: t.parent_task_id ?? undefined
			}));

			const startOfToday = new Date();
			startOfToday.setHours(0, 0, 0, 0);

			expandTasksForRange(
				startOfToday,
				new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
			);
		} catch (e) {
			console.error("Failed to fetch tasks", e);
			ui.setError(e instanceof Error ? e.message : "Failed to fetch tasks");
		}
	}

	async function addTask(task: Task) {
		try {
			// Resolve category
			let categoryId = task.category_id;
			if (!categoryId && task.category) {
				const catRes = await commands.categoriesGetCategories();
				if (catRes.status === "error") throw new Error(catRes.error.message);
				const cats = catRes.data;
				const existing = cats.find((c) => c.name === task.category);
				if (existing) {
					categoryId = existing.id;
				} else {
					const addRes = await commands.categoriesAddCategory({
						id: 0,
						name: task.category,
						color: "pomodo-orange"
					});
					if (addRes.status === "error") throw new Error(addRes.error.message);
					categoryId = addRes.data;
				}
			}

			const rrule = getRecurrenceString(task);

			const payload = {
				id: 0,
				title: task.title,
				description: task.description ?? null,
				category_id: categoryId,
				project_id: task.project_id,
				estimated_pomodoros: task.cycles,
				start_datetime: toUTCISOString(task.startTime),
				recurrence_rule: rrule ?? null,
				is_completed: false,
				completed_pomodoros: 0,
				parent_task_id: null,
				created_at: null
			};

			await db.addTask(payload);
			await fetchTasks();
			await syncICal();
		} catch (e) {
			console.error("Error adding task", e);
			ui.setError(e instanceof Error ? e.message : "Failed to add task");
		}
	}

	async function updateTask(task: Task, recurrenceChanged: boolean) {
		try {
			const categoryId = task.category_id;
			let rrule = task.recurrence_rule;
			if (recurrenceChanged) {
				const rule = getRecurrenceString(task);
				rrule = rule !== undefined ? rule : undefined;
			}

			const payload = {
				id: task.id,
				title: task.title,
				description: task.description ?? null,
				category_id: categoryId,
				project_id: task.project_id,
				estimated_pomodoros: task.cycles,
				start_datetime: toUTCISOString(task.startTime),
				recurrence_rule: rrule ?? null,
				is_completed: task.completed,
				completed_pomodoros: task.completedCycles,
				parent_task_id: task.parent_task_id ?? null,
				created_at: null // or preserve somehow if needed
			};

			await db.updateTask(payload);
			await fetchTasks();
			await syncICal();
		} catch (e) {
			console.error("Error updating task", e);
			ui.setError(e instanceof Error ? e.message : "Failed to update task");
		}
	}

	async function completeTaskInstance(task: Task) {
		try {
			if (task.recurrence_rule && !task.parent_task_id) {
				await db.completeTaskInstance(task.id, task.startTime);
			} else {
				const payload = {
					id: task.id,
					title: task.title,
					description: task.description ?? null,
					category_id: task.category_id,
					project_id: task.project_id,
					estimated_pomodoros: task.cycles,
					start_datetime: toUTCISOString(task.startTime),
					recurrence_rule: task.recurrence_rule ?? null,
					is_completed: true,
					completed_pomodoros: task.completedCycles,
					parent_task_id: task.parent_task_id ?? null,
					created_at: null
				};
				await db.updateTask(payload);
			}
			await fetchTasks();
			await syncICal();
		} catch (e) {
			console.error("Error completing task instance", e);
			ui.setError(e instanceof Error ? e.message : "Failed to complete task");
		}
	}

	function expandTasksForRange(start: Date, end: Date) {
		const expanded: Task[] = [];
		const exceptions = tasks.value.filter(
			(t) => t.parent_task_id !== null && t.parent_task_id !== undefined
		);

		tasks.value.forEach((t) => {
			// Check if task is completed and NOT recurring.
			// Previously we skipped these, but Stats/Timeline need them.
			// if (t.completed && !t.recurrence_rule) return;

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
			await db.deleteTask(id);
			await fetchTasks();
			await syncICal();
		} catch (e) {
			console.error("Failed to delete task", e);
			ui.setError(e instanceof Error ? e.message : "Failed to delete task");
		}
	}

	async function toggleTaskCompletion(task: Task) {
		try {
			const payload = {
				id: task.id,
				title: task.title,
				description: task.description ?? null,
				category_id: task.category_id,
				project_id: task.project_id,
				estimated_pomodoros: task.cycles,
				start_datetime: toUTCISOString(task.startTime),
				recurrence_rule: task.recurrence_rule ?? null,
				is_completed: !task.completed,
				completed_pomodoros: task.completedCycles,
				parent_task_id: task.parent_task_id ?? null,
				created_at: null
			};
			await db.updateTask(payload);
			await fetchTasks();
			await syncICal();
		} catch (e) {
			console.error("Error toggling task completion", e);
			ui.setError(e instanceof Error ? e.message : "Failed to update task");
		}
	}

	async function syncICal() {
		try {
			await commands.icalSyncIcal();
		} catch (e) {
			console.error("Failed to sync iCal", e);
		}
	}

	async function checkPeriodicICalSync() {
		try {
			const res = await commands.settingsGetSettingValue("last_ical_sync");
			if (res.status === "error") {
                // If key doesn't exist (migration pending?), ignore or log
                console.warn("Could not get last_ical_sync", res.error);
                return;
            }
            const lastSync = parseInt(res.data || "0", 10);
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            if (now - lastSync > oneDay) {
                console.log("Periodic iCal Sync: Triggering (Last sync > 1 day ago)");
                await syncICal();
            }
		} catch (e) {
			console.error("Failed to check periodic iCal sync", e);
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
		toggleTaskCompletion,
		expandTasksForRange,
		syncICal,
        checkPeriodicICalSync
	};
});
