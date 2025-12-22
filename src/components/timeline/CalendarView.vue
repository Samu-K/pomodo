<script setup lang="ts">
import { computed, ref } from "vue";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  format
} from "date-fns";
import { useTasks } from "../../stores/task";
import type { Task } from "../../defines/task";

const props = defineProps<{
  currentDate: Date;
}>();

const emit = defineEmits<{
  (e: 'selectDate', date: Date): void;
  (e: 'createTask', date: Date): void;
}>();

const tasksStore = useTasks();

// Generate calendar grid days
const calendarDays = computed(() => {
  const monthStart = startOfMonth(props.currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: startDate, end: endDate });
});

// Filter tasks for a specific day
const getTasksForDay = (date: Date) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return tasksStore.expandedTasks.filter(
    (task: Task) => task.startTime >= dayStart && task.startTime <= dayEnd
  ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
};

const handleDayClick = (date: Date) => {
  if (!isLongPress.value) {
    emit('selectDate', date);
  }
};

// Long Press Logic
const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const isLongPress = ref(false);

const startLongPress = (date: Date) => {
  isLongPress.value = false;
  longPressTimer.value = setTimeout(() => {
    isLongPress.value = true;
    emit('createTask', date);
  }, 500); // 500ms hold time
};

const clearLongPress = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
};

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

</script>

<template>
  <div class="flex flex-col h-full bg-light-bg dark:bg-dark-bg p-4">
    <!-- Weekday Headers -->
    <div class="grid grid-cols-7 mb-2">
      <div 
        v-for="day in weekDays" 
        :key="day"
        class="text-right text-xs font-medium text-lightText-muted dark:text-text-muted px-2"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-light-border dark:bg-dark-border border border-light-border dark:border-dark-border rounded-lg overflow-hidden">
      <div
        v-for="date in calendarDays"
        :key="date.toISOString()"
        class="bg-light-bg dark:bg-dark-bg min-h-[100px] p-1 flex flex-col cursor-pointer hover:bg-light-surface/50 dark:hover:bg-dark-surface/50 transition-colors"
        :class="{
          'bg-light-surface/20 dark:bg-dark-surface/20': !isSameMonth(date, props.currentDate)
        }"
        @click="handleDayClick(date)"
        @mousedown="startLongPress(date)"
        @touchstart="startLongPress(date)"
        @mouseup="clearLongPress"
        @mouseleave="clearLongPress"
        @touchend="clearLongPress"
      >
        <!-- Date Number -->
        <div class="flex justify-end mb-1">
          <span 
            class="text-sm w-7 h-7 flex items-center justify-center rounded-full"
            :class="{
              'bg-pomodo-red text-white': isToday(date),
              'text-lightText-primary dark:text-white': !isToday(date) && isSameMonth(date, props.currentDate),
              'text-lightText-muted dark:text-text-muted': !isSameMonth(date, props.currentDate)
            }"
          >
            {{ format(date, 'd') }}
          </span>
        </div>

        <!-- Tasks List -->
        <div class="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
          <div
            v-for="task in getTasksForDay(date)"
            :key="task.id + '_' + task.startTime.toISOString()"
            class="px-1.5 py-0.5 rounded text-[10px] truncate text-white"
            :class="`bg-gradient-to-br ${task.gradient}`"
            :title="`${task.title} (${format(task.startTime, 'HH:mm')})`"
          >
            {{ task.title }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-700 rounded;
}
</style>
