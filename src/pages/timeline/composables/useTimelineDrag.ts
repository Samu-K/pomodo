import type { Ref } from "vue";
import { onUnmounted, ref } from "vue";

export function useTimelineDrag(
	selectedDate: Ref<Date>,
	blockHeight: number,
	startTime: number,
	onDragComplete: (date: Date, cycles: number) => void,
	calculateTaskDuration: (cycles: number) => number
) {
	let timelineRect: DOMRect | null = null;
	const isDragging = ref(false);
	const dragStartY = ref(0);
	const dragCurrentY = ref(0);
	const dragStartTime = ref<Date | null>(null);
	const dragCycles = ref(1);

	const minutesToPixels = (mins: number) => (mins * (blockHeight * 4)) / 60;

	const handleMouseDown = (e: MouseEvent) => {
		// Parent should check for mobile/viewmode if needed
		const target = e.target as HTMLElement;
		if (target.closest('[data-testid="timeline-task-block"]')) {
			return;
		}

		e.preventDefault();

		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		timelineRect = rect;
		const y = e.clientY - rect.top;

		isDragging.value = true;

		// Snap start position to nearest 10 minutes
		const totalPixelsPerHour = blockHeight * 4;
		const pixelsPer10Mins = totalPixelsPerHour / 6;
		const snappedY = Math.round(y / pixelsPer10Mins) * pixelsPer10Mins;

		dragStartY.value = snappedY;
		dragCurrentY.value = snappedY;
		dragCycles.value = 1;

		// Calculate start time based on snapped Y
		const hoursFromStart = snappedY / totalPixelsPerHour;
		const startTimeValue = startTime + hoursFromStart;

		const startHour = Math.floor(startTimeValue);
		const startMinute = Math.round((startTimeValue - startHour) * 60);

		const date = new Date(selectedDate.value);
		date.setHours(startHour, startMinute, 0, 0);
		dragStartTime.value = date;

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
	};

	const handleMouseMove = (e: MouseEvent) => {
		if (!isDragging.value || !timelineRect) return;

		const y = e.clientY - timelineRect.top;
		dragCurrentY.value = y;

		// Calculate how many cycles fit in the drag distance
		const dragDistance = Math.abs(y - dragStartY.value);

		// Find the number of cycles where calculateTaskDuration(cycles) closest to dragDistance
		let bestCycles = 1;
		let minDiff = Math.abs(
			minutesToPixels(calculateTaskDuration(1)) - dragDistance
		);

		for (let c = 2; c <= 20; c++) {
			const durationPx = minutesToPixels(calculateTaskDuration(c));
			const diff = Math.abs(durationPx - dragDistance);
			if (diff < minDiff) {
				minDiff = diff;
				bestCycles = c;
			} else if (durationPx > dragDistance + 100) {
				break;
			}
		}
		dragCycles.value = bestCycles;
	};

	const handleMouseUp = () => {
		if (!isDragging.value) return;

		// Final calculation of start time (if dragged upwards)
		const actualStartY = Math.min(dragStartY.value, dragCurrentY.value);
		const totalPixelsPerHour = blockHeight * 4;
		const hoursFromStart = actualStartY / totalPixelsPerHour;
		const startTimeValue = startTime + hoursFromStart;
		const startHour = Math.floor(startTimeValue);
		const startMinute = Math.round((startTimeValue - startHour) * 60);

		const date = new Date(selectedDate.value);
		date.setHours(startHour, startMinute, 0, 0);

		onDragComplete(date, dragCycles.value);

		isDragging.value = false;
		window.removeEventListener("mousemove", handleMouseMove);
		window.removeEventListener("mouseup", handleMouseUp);
	};

	onUnmounted(() => {
		window.removeEventListener("mousemove", handleMouseMove);
		window.removeEventListener("mouseup", handleMouseUp);
	});

	return {
		isDragging,
		dragStartY,
		dragCurrentY,
		dragCycles,
		handleMouseDown,
		minutesToPixels
	};
}
