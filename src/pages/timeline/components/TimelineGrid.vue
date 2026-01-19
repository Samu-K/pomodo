<script setup lang="ts">
import { computed, toRefs } from "vue";
import { useDisplay } from "vuetify";
import type { Task } from "../../../defines/task";
import { useTimelineDrag } from "../composables/useTimelineDrag";

const props = withDefaults(
	defineProps<{
		tasks: Task[];
		selectedDate: Date;
		currentTimePosition: number;
		calculateTaskDuration: (cycles: number) => number;
		blockHeight?: number;
		startTime?: number;
		endTime?: number;
	}>(),
	{
		blockHeight: 16,
		startTime: 0,
		endTime: 24
	}
);

const emit = defineEmits<{
	(e: "select-task", task: Task): void;
	(e: "create-task", date: Date, cycles: number): void;
}>();

const { selectedDate, blockHeight, startTime, calculateTaskDuration } =
	toRefs(props);
const { mobile } = useDisplay();

const timeBlockAmount = computed(() => props.endTime - props.startTime);

const {
	isDragging,
	dragStartY,
	dragCurrentY,
	dragCycles,
	handleMouseDown,
	minutesToPixels
} = useTimelineDrag(
	selectedDate,
	blockHeight.value,
	startTime.value,
	(date, cycles) => emit("create-task", date, cycles),
	calculateTaskDuration.value
);

function calculateTaskPos(time: Date): number {
	const pos_h = (time.getHours() - props.startTime) * (props.blockHeight * 4);
	return pos_h + (time.getMinutes() / 60) * props.blockHeight * 4;
}

const onMouseDown = (e: MouseEvent) => {
	const isMobile = mobile.value && !window.matchMedia("(hover: hover)").matches;
	// We don't check viewMode here as it's the grid's job to just handle drag if shown
	if (isMobile) return;
	handleMouseDown(e);
};
</script>

<template>
  <div class="flex h-full">
    <!-- Time Column -->
    <div class="w-16 flex-col">
      <div 
        v-for="hourIndex in timeBlockAmount" 
        :key="hourIndex"
        :class="`h-${blockHeight} flex items-center justify-center text-xs text-lightText-muted dark:text-text-muted border-b border-light-border dark:border-dark-border`"
      >
        <span>{{ (startTime + hourIndex - 1).toString().padStart(2, '0') }}</span>
      </div>
    </div>

    <!-- Tasks Column -->
    <div 
      class="flex-1 relative cursor-default select-none"
      @mousedown="onMouseDown"
    >
      <!-- Grid Lines -->
      <div 
        v-for="(_, index) in timeBlockAmount" 
        :key="index"
        class="absolute w-full h-16 border-b border-light-border dark:border-dark-border" 
        :style="`top: ${index * (blockHeight*4)}px`"
      ></div>

      <!-- Ghost Task (during drag) -->
      <div
        v-if="isDragging"
        class="absolute left-4 right-4 rounded-lg bg-pomodo-orange/40 border-2 border-pomodo-orange z-[999] pointer-events-none shadow-2xl"
        :style="`top: ${Math.min(dragStartY, dragCurrentY)}px; height: ${minutesToPixels(calculateTaskDuration(dragCycles))}px;`"
      >
        <div class="p-4 bg-pomodo-orange/10 h-full backdrop-blur-[2px]">
          <h3 class="text-white font-bold text-sm drop-shadow-md">New Task</h3>
          <p class="text-white font-semibold text-xs mt-1 drop-shadow-md">{{ dragCycles }} pomodoros</p>
        </div>
      </div>

      <!-- Task Blocks -->
      <button
        data-testid="timeline-task-block"
        @click="emit('select-task', task)"
        v-for="task in tasks"
        :key="task.id + '_' + task.startTime.toISOString()"
        class="absolute left-4 right-4 rounded-lg cursor-pointer hover:scale-[1.02] transition-transform shadow-lg text-left overflow-hidden border border-white/10"
        :class="[
          `bg-gradient-to-br ${task.gradient}`,
          { 'opacity-50': task.completed },
          task.cycles === 1 ? 'px-3 flex items-center' : 'p-3'
        ]"
        :style="`top: ${calculateTaskPos(task.startTime)}px; height: ${minutesToPixels(calculateTaskDuration(task.cycles))}px;`"
      >
        <!-- 1 Cycle: Compact View -->
        <div v-if="task.cycles === 1" class="flex items-center w-full">
          <h3 class="text-white font-medium text-xs truncate w-full">{{ task.title }}</h3>
        </div>

        <!-- >1 Cycles: Detailed View -->
        <div v-else>
          <h3 class="text-white font-semibold text-sm">{{ `${task.title} - ${task.startTime.toTimeString().slice(0, 5)}`}}</h3>
          <p class="text-white/80 text-xs mt-1">{{ task.cycles }} pomodoros • {{ task.category }}</p>
          
          <!-- Progress Dots -->
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
        v-if="currentTimePosition >= 0"
        class="absolute left-0 right-0 flex items-center" 
        :style="`top: ${currentTimePosition}px;`"
      >
        <div class="w-3 h-3 bg-pomodo-red rounded-full"></div>
        <div class="flex-1 h-0.5 bg-pomodo-red"></div>
      </div>
    </div>
  </div>
</template>
