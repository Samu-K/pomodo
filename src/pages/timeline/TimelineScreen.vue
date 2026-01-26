<script setup lang="ts">
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { Plus } from "lucide-vue-next";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import CreateTaskModal from "../../components/task/CreateTaskModal.vue";
import TaskDetailsModal from "../../components/task/TaskDetailsModal.vue";
import CalendarView from "../../components/timeline/CalendarView.vue";
import { useTaskCalculations } from "../../composables/useTaskCalculations";
import type { Task } from "../../defines/task.ts";
import { useSettingsStore } from "../../stores/settings";
import { useTasks } from "../../stores/task.ts";
import TimelineGrid from "./components/TimelineGrid.vue";
import TimelineHeader from "./components/TimelineHeader.vue";

const tasksStore = useTasks();
const settingsStore = useSettingsStore();
const { calculateTaskDuration } = useTaskCalculations();

const showCreateModal = ref(false);
const showDetailsModal = ref(false);
const selectedTask = ref<Task | null>(null);
const viewMode = ref<"timeline" | "calendar">("timeline");
const createTaskDate = ref<Date | undefined>(undefined);
const createCycles = ref<number>(1);
const scrollContainerRef = ref<HTMLElement | null>(null);
const selectedDate = ref<Date>(new Date());
const blockHeight = 16;

onMounted(async () => {
	if (tasksStore.tasks.length === 0) await tasksStore.fetchTasks();
	if (settingsStore.settings.length === 0) await settingsStore.fetchSettings();
	scrollToRecommended();
});

const updateExpandedTasks = () => {
	if (viewMode.value === "timeline") {
		const start = new Date(selectedDate.value);
		start.setDate(start.getDate() - 3);
		const end = new Date(selectedDate.value);
		end.setDate(end.getDate() + 4);
		tasksStore.expandTasksForRange(start, end);
	} else {
		const monthStart = startOfMonth(selectedDate.value);
		const monthEnd = endOfMonth(monthStart);
		const start = startOfWeek(monthStart, { weekStartsOn: 1 });
		const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
		start.setDate(start.getDate() - 1);
		end.setDate(end.getDate() + 1);
		tasksStore.expandTasksForRange(start, end);
	}
};

const tasksForSelectedDate = computed(() => {
	const dayStart = new Date(selectedDate.value);
	dayStart.setHours(0, 0, 0, 0);
	const dayEnd = new Date(dayStart);
	dayEnd.setDate(dayEnd.getDate() + 1);
	return tasksStore.expandedTasks.filter(
		(task) => task.startTime >= dayStart && task.startTime < dayEnd
	);
});

const recommendedTimeRange = computed(() => {
	const filtered = tasksForSelectedDate.value;
	if (filtered.length === 0) return { start: 8, end: 18 };
	const startHours = filtered.map((t) => t.startTime.getHours());
	const endHours = filtered.map((t) => {
		const durationMins = calculateTaskDuration(t.cycles);
		return (
			t.startTime.getHours() +
			Math.floor((t.startTime.getMinutes() + durationMins) / 60)
		);
	});
	const minStart = Math.min(...startHours);
	const maxEnd = Math.max(...endHours);
	return {
		start: Math.max(0, minStart - 1),
		end: Math.min(24, Math.max(maxEnd + 1, minStart + 4))
	};
});

const scrollToRecommended = async () => {
	await nextTick();
	if (scrollContainerRef.value) {
		const targetScroll = recommendedTimeRange.value.start * blockHeight * 4;
		scrollContainerRef.value.scrollTo({
			top: targetScroll,
			behavior: "smooth"
		});
	}
};

watch(
	selectedDate,
	() => {
		updateExpandedTasks();
		scrollToRecommended();
	},
	{ immediate: true }
);
watch(() => tasksStore.tasks, updateExpandedTasks, { deep: true });
watch(viewMode, (newMode) => {
	updateExpandedTasks();
	if (newMode === "timeline") scrollToRecommended();
});

const isDateToday = computed(
	() => selectedDate.value.toDateString() === new Date().toDateString()
);

const formatTime = (decimalHours: number): string => {
	const hours = Math.floor(decimalHours);
	const minutes = Math.round((decimalHours - hours) * 60);
	if (hours === 0) return `${minutes}m`;
	if (minutes === 0) return `${hours}h`;
	return `${hours}h ${minutes}m`;
};

const totalScheduledTime = computed(() => {
	const totalTime = tasksForSelectedDate.value.reduce((total, task) => {
		return total + calculateTaskDuration(task.cycles) / 60;
	}, 0);
	return formatTime(totalTime);
});

const currentTimePosition = computed(() => {
	if (!isDateToday.value) return -100;
	const now = new Date();
	return (now.getHours() + now.getMinutes() / 60) * blockHeight * 4;
});

const handleNavigate = (delta: number) => {
	const newDate = new Date(selectedDate.value);
	if (viewMode.value === "timeline") newDate.setDate(newDate.getDate() + delta);
	else newDate.setMonth(newDate.getMonth() + delta);
	selectedDate.value = newDate;
};

const onGridCreateTask = (date: Date, cycles: number) => {
	createTaskDate.value = date;
	createCycles.value = cycles;
	showCreateModal.value = true;
};

const openTaskDetails = (task: Task) => {
	selectedTask.value = task;
	showDetailsModal.value = true;
};
</script>

<template>
  <div class="flex flex-col h-full bg-light-bg dark:bg-dark-bg relative">
    <TimelineHeader 
      :selectedDate="selectedDate"
      :viewMode="viewMode"
      :isDateToday="isDateToday"
      @prev="handleNavigate(-1)"
      @next="handleNavigate(1)"
      @today="selectedDate = new Date()"
      @update:viewMode="viewMode = $event"
    />

    <CalendarView 
      v-if="viewMode === 'calendar'" 
      :currentDate="selectedDate"
      @selectDate="selectedDate = $event; viewMode = 'timeline'"
      @createTask="createTaskDate = $event; showCreateModal = true"
    />

    <div v-else ref="scrollContainerRef" class="flex-1 overflow-auto">
      <TimelineGrid 
        :tasks="tasksForSelectedDate"
        :selectedDate="selectedDate"
        :currentTimePosition="currentTimePosition"
        :calculateTaskDuration="calculateTaskDuration"
        :blockHeight="blockHeight"
        @select-task="openTaskDetails"
        @create-task="onGridCreateTask"
      />
    </div>

    <!-- Floating Action Button -->
    <button 
      @click="showCreateModal = true"
      class="absolute bottom-18 right-6 w-14 h-14 bg-gradient-to-br from-pomodo-orange to-pomodo-red rounded-full text-white shadow-fab hover:shadow-fab-hover hover:scale-110 transition-all flex items-center justify-center"
    >
      <Plus :size="24" />
    </button>

    <!-- Quick Stats Bar -->
    <div v-if="viewMode === 'timeline'" class="px-6 py-3 bg-light-surface dark:bg-dark-pure border-t border-light-border dark:border-dark-border">
      <div class="flex justify-around text-xs">
        <div class="text-center">
          <span class="text-lightText-muted dark:text-text-muted block">Scheduled</span>
          <span data-testid="stats-scheduled-count" class="text-pomodo-orange font-semibold">{{tasksForSelectedDate.length}}</span>
        </div>
        <div class="text-center">
          <span class="text-lightText-muted dark:text-text-muted block">Total Time</span>
          <span class="text-pomodo-red font-semibold">{{totalScheduledTime}}</span>
        </div>
        <div class="text-center">
          <span class="text-lightText-muted dark:text-text-muted block">Completed</span>
          <span class="text-green-500 font-semibold">{{tasksForSelectedDate.filter(t => t.completed).length}}</span>
        </div>
      </div>
    </div>

    <CreateTaskModal
      v-if="showCreateModal"
      :initialDate="createTaskDate"
      :initialCycles="createCycles"
      @close="showCreateModal = false; createTaskDate = undefined; tasksStore.fetchTasks()"
    />

    <TaskDetailsModal
      v-if="showDetailsModal && selectedTask"
      :selTask="selectedTask"
      @close="showDetailsModal = false; selectedTask = null; tasksStore.fetchTasks()"
    />
  </div>
</template>
