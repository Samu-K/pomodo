import { defineStore } from "pinia";
import { RRule } from "rrule";
import { ref } from "vue";
import { RecurrenceType } from "../defines/recur";
import type { Task } from "../defines/task";
import { getRecurrenceString } from "../funcs/task";
import { fromUTCString, toUTCISOString } from "../funcs/stats/date_handling";
import { useUIStore } from "./ui";
import * as db from "../funcs/db/tasks";
import { commands } from "../funcs/commands";





export const useTasks = defineStore("tasks", () => {
    const tasks = ref<Task[]>([]);
    const expandedTasks = ref<Task[]>([]);

    const ui = useUIStore();

    async function fetchTasks() {
        try {
            const fetched = await db.getTasks();
            // Fetch categories to map names (using commands directly for now as it's a simple read)
            const catRes = await commands.categoriesGetCategories();
            if (catRes.status === "error") throw new Error(catRes.error.message);
            const categories = catRes.data;
            const catMap = new Map(categories.map((c) => [c.id, c.name]));

            tasks.value = fetched.map((t) => ({
                id: t.id,
                title: t.title,
                category: t.category_id ? catMap.get(t.category_id) || "" : "",
                category_id: t.category_id,
                cycles: t.estimated_pomodoros || 1,
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
        } catch (e: any) {
            console.error("Failed to fetch tasks", e);
            ui.setError(e.message || "Failed to fetch tasks");
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
                    const addRes = await commands.categoriesAddCategory({ id: 0, name: task.category, color: "pomodo-orange" });
                    if (addRes.status === "error") throw new Error(addRes.error.message);
                    categoryId = addRes.data;
                }
            }

            const rrule = getRecurrenceString(task);

            const payload = {
                id: 0,
                title: task.title,
                category_id: categoryId,
                estimated_pomodoros: task.cycles,
                start_datetime: toUTCISOString(task.startTime),
                recurrence_rule: rrule ?? null,
                is_completed: false,
                parent_task_id: null,
                created_at: null
            };

            await db.addTask(payload);
            await fetchTasks();
        } catch (e: any) {
            console.error("Error adding task", e);
            ui.setError(e.message || "Failed to add task");
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
                category_id: categoryId,
                estimated_pomodoros: task.cycles,
                start_datetime: toUTCISOString(task.startTime),
                recurrence_rule: rrule ?? null,
                is_completed: task.completed,
                parent_task_id: task.parent_task_id ?? null,
                created_at: null // or preserve somehow if needed
            };

            await db.updateTask(payload);
            await fetchTasks();
        } catch (e: any) {
            console.error("Error updating task", e);
            ui.setError(e.message || "Failed to update task");
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
                    category_id: task.category_id,
                    estimated_pomodoros: task.cycles,
                    start_datetime: toUTCISOString(task.startTime),
                    recurrence_rule: task.recurrence_rule ?? null,
                    is_completed: true,
                    parent_task_id: task.parent_task_id ?? null,
                    created_at: null
                };
                await db.updateTask(payload);
            }
            await fetchTasks();
        } catch (e: any) {
            console.error("Error completing task instance", e);
            ui.setError(e.message || "Failed to complete task");
        }
    }

    function expandTasksForRange(start: Date, end: Date) {
        const expanded: Task[] = [];
        const exceptions = tasks.value.filter(
            (t) => t.parent_task_id !== null && t.parent_task_id !== undefined
        );

        tasks.value.forEach((t) => {
            if (t.completed && !t.recurrence_rule) return;

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
        } catch (e: any) {
            console.error("Failed to delete task", e);
            ui.setError(e.message || "Failed to delete task");
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
