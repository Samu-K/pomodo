import type { Task } from "../defines/task";
import { useTaskCalculations } from "./useTaskCalculations";

export interface OverlapInfo {
	overlappingTask: Task;
	overlapStartTime: Date;
	overlapEndTime: Date;
}

// Composable for detecting task time overlaps
export function useTaskOverlap() {
	const { calculateTaskDuration } = useTaskCalculations();

	function getTaskEndTime(task: Task): Date {
		const durationMinutes = calculateTaskDuration(task.cycles);
		return new Date(task.startTime.getTime() + durationMinutes * 60 * 1000);
	}

	// Check if two time ranges overlap
	function timeRangesOverlap(
		start1: Date,
		end1: Date,
		start2: Date,
		end2: Date
	): boolean {
		return start1 < end2 && end1 > start2;
	}

	/**
	 * Check if a new task overlaps with any existing tasks
	 * @param newTask The task being created/modified
	 * @param existingTasks List of existing tasks to check against
	 * @param excludeTaskId Optional task ID to exclude (for edit scenarios)
	 * @returns OverlapInfo if overlap found, null otherwise
	 */
	function checkForOverlap(
		newTask: Task,
		existingTasks: Task[],
		excludeTaskId?: number
	): OverlapInfo | null {
		const newTaskStart = newTask.startTime;
		const newTaskEnd = getTaskEndTime(newTask);

		for (const existingTask of existingTasks) {
			// Skip the task being edited
			if (excludeTaskId !== undefined && existingTask.id === excludeTaskId) {
				continue;
			}

			// Skip completed tasks
			if (existingTask.completed) {
				continue;
			}

			const existingStart = existingTask.startTime;
			const existingEnd = getTaskEndTime(existingTask);

			if (
				timeRangesOverlap(newTaskStart, newTaskEnd, existingStart, existingEnd)
			) {
				return {
					overlappingTask: existingTask,
					overlapStartTime: new Date(
						Math.max(newTaskStart.getTime(), existingStart.getTime())
					),
					overlapEndTime: new Date(
						Math.min(newTaskEnd.getTime(), existingEnd.getTime())
					)
				};
			}
		}

		return null;
	}

	return {
		checkForOverlap,
		getTaskEndTime
	};
}
