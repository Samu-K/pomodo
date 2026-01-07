import { commands, type Task } from "../commands";
import { toUTCISOString } from "../stats/date_handling";

export const addTask = async (task: Task) => {
	const res = await commands.tasksAddTask(task);
	if (res.status === "error") throw new Error(res.error.message);
	return res.data;
};

export const getTasks = async () => {
	const res = await commands.tasksGetTasks();
	if (res.status === "error") throw new Error(res.error.message);
	return res.data;
};

export const updateTask = async (task: Task) => {
	const res = await commands.tasksUpdateTask(task);
	if (res.status === "error") throw new Error(res.error.message);
	return res.data;
};

export const deleteTask = async (id: number) => {
	const res = await commands.tasksDeleteTask(id);
	if (res.status === "error") throw new Error(res.error.message);
	return res.data;
};

export const completeTaskInstance = async (
	parentTaskId: number,
	date: Date
) => {
	const res = await commands.tasksCompleteTaskInstance(
		parentTaskId,
		toUTCISOString(date)
	);
	if (res.status === "error") throw new Error(res.error.message);
	return res.data;
};
