<script setup lang="ts">
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import CreateTaskModal from "../../components/task/CreateTaskModal.vue";
import TaskDetailsModal from "../../components/task/TaskDetailsModal.vue";
import CalendarView from "../../components/timeline/CalendarView.vue";
import type { Task } from "../../defines/task.ts";
import { useSettingsStore } from "../../stores/settings.ts";
import { useTasks } from "../../stores/task.ts";

const tasksStore = useTasks();
const settingsStore = useSettingsStore();

const showCreateModal = ref(false);
const showDetailsModal = ref(false);
const selectedTask = ref<Task | null>(null);
const viewMode = ref<"timeline" | "calendar">("timeline");
const createTaskDate = ref<Date | undefined>(undefined);

// Constants
const blockHeight = 16;

// Get timer settings from settings store
const focusDuration = computed(() => {
	const val = settingsStore.settings.find(
		(s) => s.key === "Focus Duration"
	)?.value;
	return val ? Number(val) : 25; // Default to 25 minutes
});

const shortBreakTime = computed(() => {
	const val = settingsStore.settings.find(
		(s) => s.key === "Short Break Time"
	)?.value;
	return val ? Number(val) : 5; // Default to 5 minutes
});

const longBreakTime = computed(() => {
	const val = settingsStore.settings.find(
		(s) => s.key === "Long Break Time"
	)?.value;
	return val ? Number(val) : 15; // Default to 15 minutes
});

const longBreakInterval = computed(() => {
	const val = settingsStore.settings.find(
		(s) => s.key === "Long Break Interval"
	)?.value;
	return val ? Number(val) : 4; // Default to every 4 pomodoros
});

/**
 * Calculate total task duration in minutes, including rest breaks.
 * @param cycles - Number of pomodoro cycles
 * @returns Total duration in minutes (focus time + break time)
 */
const calculateTaskDuration = (cycles: number): number => {
	if (cycles <= 0) return 0;
	if (cycles === 1) return focusDuration.value; // Single cycle, no breaks

	// Focus time
	const totalFocusTime = cycles * focusDuration.value;

	// Calculate number of breaks (between each focus session)
	const totalBreaks = cycles - 1;

	// How many long breaks occur?
	// Long break happens after every longBreakInterval cycles
	const longBreaksCount = Math.floor(cycles / longBreakInterval.value);
	const shortBreaksCount = totalBreaks - longBreaksCount;

	// Total break time
	const totalBreakTime =
		shortBreaksCount * shortBreakTime.value +
		longBreaksCount * longBreakTime.value;

	return totalFocusTime + totalBreakTime;
};

const selectedDate = ref<Date>(new Date());

// Fetch tasks on mount
onMounted(async () => {
	if (tasksStore.tasks.length === 0) {
		await tasksStore.fetchTasks();
	}
});

// Re-expand tasks when selected date changes OR when tasks are updated OR view mode changes
const updateExpandedTasks = () => {
	if (viewMode.value === "timeline") {
		const start = new Date(selectedDate.value);
		start.setDate(start.getDate() - 3);
		const end = new Date(selectedDate.value);
		end.setDate(end.getDate() + 4);
		tasksStore.expandTasksForRange(start, end);
	} else {
		// Calendar Mode
		const monthStart = startOfMonth(selectedDate.value);
		const monthEnd = endOfMonth(monthStart);
		const start = startOfWeek(monthStart, { weekStartsOn: 1 });
		const end = endOfWeek(monthEnd, { weekStartsOn: 1 });

		// Add buffer
		start.setDate(start.getDate() - 1);
		end.setDate(end.getDate() + 1);

		tasksStore.expandTasksForRange(start, end);
	}
};

watch(selectedDate, updateExpandedTasks, { immediate: true });
watch(() => tasksStore.tasks, updateExpandedTasks, { deep: true });
watch(viewMode, updateExpandedTasks);

// Filter expanded tasks for selected date
const tasksForSelectedDate = computed(() => {
	const dayStart = new Date(selectedDate.value);
	dayStart.setHours(0, 0, 0, 0);
	const dayEnd = new Date(dayStart);
	dayEnd.setDate(dayEnd.getDate() + 1);

	return tasksStore.expandedTasks.filter(
		(task) => task.startTime >= dayStart && task.startTime < dayEnd
	);
});

// Dynamic time range based on tasks for the selected date
const timeRange = computed(() => {
	const filtered = tasksForSelectedDate.value;
	if (filtered.length === 0) {
		// Default: 8 AM to 6 PM (10 hour range)
		return { start: 8, end: 18 };
	}

	const startHours = filtered.map((t) => t.startTime.getHours());
	const endHours = filtered.map((t) => {
		const durationMins = calculateTaskDuration(t.cycles);
		return (
			t.startTime.getHours() +
			Math.ceil((t.startTime.getMinutes() + durationMins) / 60)
		);
	});

	const minStart = Math.min(...startHours);
	const maxEnd = Math.max(...endHours);

	return {
		start: Math.max(0, minStart - 1), // One hour buffer before
		end: Math.min(24, Math.max(maxEnd + 1, minStart + 4)) // One hour buffer after, min 4 hours
	};
});

const startTime = computed(() => timeRange.value.start);
const endTime = computed(() => timeRange.value.end);
const timeBlockAmount = computed(() => endTime.value - startTime.value);

const isDateToday = (): boolean => {
	return selectedDate.value.toDateString() === new Date().toDateString();
};

const formatTime = (decimalHours: number): string => {
	const hours = Math.floor(decimalHours);
	const minutes = Math.round((decimalHours - hours) * 60);

	if (hours === 0) return `${minutes}m`;
	if (minutes === 0) return `${hours}h`;
	return `${hours}h ${minutes}m`;
};

const tasksLen = (tasks: Array<Task>): string => {
	const totalTime = tasks.reduce((total, task) => {
		return total + calculateTaskDuration(task.cycles) / 60;
	}, 0);
	return formatTime(totalTime);
};

// Current time indicator position (reactive)
const currentTimePosition = computed(() => {
	if (!isDateToday()) return -100; // Off-screen when not today
	const now = new Date();
	return (
		(now.getHours() - startTime.value + 1 + now.getMinutes() / 60) *
		blockHeight *
		4
	);
});

function calculateTaskPos(time: Date): number {
	const adjuster = startTime.value - 1;
	const pos_h = (time.getHours() - adjuster) * (blockHeight * 4);
	return pos_h + (time.getMinutes() / 60) * blockHeight * 4;
}

const goToPrevDate = () => {
	const newDate = new Date(selectedDate.value);
	if (viewMode.value === "timeline") {
		newDate.setDate(newDate.getDate() - 1);
	} else {
		newDate.setMonth(newDate.getMonth() - 1);
	}
	selectedDate.value = newDate;
};

const goToNextDate = () => {
	const newDate = new Date(selectedDate.value);
	if (viewMode.value === "timeline") {
		newDate.setDate(newDate.getDate() + 1);
	} else {
		newDate.setMonth(newDate.getMonth() + 1);
	}
	selectedDate.value = newDate;
};

const openTaskDetails = (task: Task) => {
	selectedTask.value = task;
	showDetailsModal.value = true;
};

const handleCreateModalClose = () => {
	showCreateModal.value = false;
	createTaskDate.value = undefined;
	// Refresh tasks after creation
	tasksStore.fetchTasks();
};

const handleDetailsModalClose = () => {
	showDetailsModal.value = false;
	selectedTask.value = null;
	// Refresh tasks after potential edits
	tasksStore.fetchTasks();
};

const handleCalendarDateSelect = (date: Date) => {
	selectedDate.value = date;
	viewMode.value = "timeline";
};

const handleCalendarCreateTask = (date: Date) => {
	createTaskDate.value = date;
	showCreateModal.value = true;
};
</script>

<template>
  <div class="flex flex-col h-full bg-light-bg dark:bg-dark-bg relative">
    <!-- Header with Date Navigation -->
    <div class="px-6 py-4 border-b border-light-border dark:border-dark-border mb-2 ">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button 
            data-testid="prev-date"
            class="w-8 h-8 rounded-full border border-pomodo-orange text-pomodo-orange hover:bg-pomodo-orange hover:text-white transition-colors flex items-center justify-center"
            @click="goToPrevDate"
          >
            <ChevronLeft :size="16" />
          </button>
          <span data-testid="selected-date-display" class="mt-3 text-lg font-semibold text-pomodo-orange">
            <div class="flex">
              <p v-if="viewMode === 'timeline'">
                <span v-if="isDateToday()">Today</span>
                <span v-else>{{ selectedDate.toLocaleString('default', { day: 'numeric', month: 'short' }) }}</span>
              </p>
              <p v-else>
                {{ selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' }) }}
              </p>
            </div>
          </span>
          <button 
            data-testid="next-date"
            class="w-8 h-8 rounded-full border border-pomodo-orange text-pomodo-orange hover:bg-pomodo-orange hover:text-white transition-colors flex items-center justify-center"
            @click="goToNextDate"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
        <!-- Calendar Toggle -->
        <button 
          class="mt-3 mr-2 text-pomodo-orange hover:text-pomodo-gold transition-colors"
          @click="viewMode = viewMode === 'timeline' ? 'calendar' : 'timeline'"
          :title="viewMode === 'timeline' ? 'Switch to Calendar' : 'Switch to Timeline'"
        >
          <Calendar :size="20" />
        </button>

        <button class="mt-3 text-pomodo-orange hover:text-pomodo-gold transition-colors"
          @click='selectedDate = new Date()'
        >
          <span class="text-sm">Today</span>
        </button>
      </div>
    </div>

    <!-- Timeline Grid -->
    <CalendarView 
      v-if="viewMode === 'calendar'" 
      :currentDate="selectedDate"
      @selectDate="handleCalendarDateSelect"
      @createTask="handleCalendarCreateTask"
    />

    <div v-else class="flex-1 overflow-auto">
      <div class="flex h-full">
        <!-- Time Column -->
        <div class="w-16 flex-col ">
          <div 
            v-for="time in timeBlockAmount+3" 
            :key="time"
            :class="`h-${blockHeight} flex items-center justify-center text-xs text-lightText-muted dark:text-text-muted border-b border-light-border dark:border-dark-border`"
          >
            <span v-if="startTime+time-2 < 10" class="first">{{ `0${startTime+time-2}` }}</span>
            <span v-else >{{ `${startTime+time-2}` }}</span>
          </div>
        </div>

        <!-- Tasks Column -->
        <div class="flex-1 relative">
          <!-- Grid Lines -->
          <div 
            v-for="(_, index) in timeBlockAmount+3" 
            :key="index"
            class="absolute w-full h-16 border-b border-light-border dark:border-dark-border" 
            :style="`top: ${index * (blockHeight*4)}px`"
          ></div>


          <!-- Task Blocks -->
          <button
            data-testid="timeline-task-block"
            @click="openTaskDetails(task)"
            :disabled="task.completed"
            v-for="task in tasksForSelectedDate"
            :key="task.id + '_' + task.startTime.toISOString()"
            class="absolute left-4 right-4 rounded-lg cursor-pointer hover:scale-[1.02] transition-transform shadow-lg text-left overflow-hidden border border-white/10"
            :class="[
              `bg-gradient-to-br ${task.gradient}`,
              { 'opacity-50': task.completed },
              task.cycles === 1 ? 'px-3 flex items-center' : 'p-3'
            ]"
            :style="`top: ${calculateTaskPos(task.startTime)}px; height: ${calculateTaskDuration(task.cycles)}px;`"
          >
            <!-- 1 Cycle: Compact View -->
            <div v-if="task.cycles === 1" class="flex items-center w-full">
              <h3 class="text-white font-medium text-xs truncate w-full">{{ task.title }}</h3>
            </div>

            <!-- >1 Cycles: Detailed View -->
            <div v-else>
              <h3 class="text-white font-semibold text-sm">{{ `${task.title} - ${task.startTime.toTimeString().slice(0, 5)}`}}</h3>
              <p class="text-white/80 text-xs mt-1">{{ task.cycles }} pomodoros • {{ task.category }}</p>
              
              <!-- Progress Dots (only if >2 to save space, or keep >2) -->
              <div v-if="task.cycles > 2" class="flex gap-1 mt-2">
                <div 
                  v-for="i in task.cycles" 
                  :key="i"
                  class="w-2 h-2 rounded-full bg-white/30 "
                ></div>
              </div>
            </div>
          </button>

          <!-- Current Time Indicator -->
          <div 
            class="absolute left-0 right-0 flex items-center" 
            :style="`top: ${currentTimePosition}px;`"
          >
            <div class="w-3 h-3 bg-pomodo-red rounded-full"></div>
            <div class="flex-1 h-0.5 bg-pomodo-red"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Action Button -->
    <button 
      @click="showCreateModal = true"
      class="absolute bottom-18 right-6 w-14 h-14 bg-gradient-to-br from-pomodo-orange to-pomodo-red rounded-full text-white shadow-fab hover:shadow-fab-hover hover:scale-110 transition-all flex items-center justify-center"
    >
      <Plus :size="24" />
    </button>

    <!-- Quick Stats Bar -->
    <div class="px-6 py-3 bg-light-surface dark:bg-dark-pure border-t border-light-border dark:border-dark-border">
      <div class="flex justify-around text-xs">
        <div class="text-center">
          <span class="text-lightText-muted dark:text-text-muted block">Scheduled</span>
          <span data-testid="stats-scheduled-count" class="text-pomodo-orange font-semibold">{{tasksForSelectedDate.length}}</span>
        </div>
        <div class="text-center">
          <span class="text-lightText-muted dark:text-text-muted block">Total Time</span>
          <span class="text-pomodo-red font-semibold">{{tasksLen(tasksForSelectedDate)}}</span>
        </div>
        <div class="text-center">
          <span class="text-lightText-muted dark:text-text-muted block">Completed</span>
          <span class="text-green-500 font-semibold">{{tasksForSelectedDate.filter((task) => {return task.completed;}).length}}</span>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CreateTaskModal
      v-if="showCreateModal"
      :initialDate="createTaskDate"
      @close="handleCreateModalClose"
    />

    <TaskDetailsModal
      v-if="showDetailsModal && selectedTask"
      :selTask="selectedTask"
      @close="handleDetailsModalClose"
    />
  </div>
</template>
