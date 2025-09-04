<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus } from "lucide-vue-next";

const emit = defineEmits<{
	"add-task": [];
	"task-details": [];
}>();

// Sample data
const blockHeight = 16;
const cycleLen = 25;

interface Task {
	id: number;
	title: string;
	category: string;
	cycles: number;
	startTime: string;
	gradient: string;
}

const tasks: Array<Task> = [
	{
		id: 12,
		title: "Project Review",
		category: "Work",
		cycles: 4,
		startTime: "08:00",
		gradient: "from-pomodo-orange to-pomodo-red",
	},
	{
		id: 11,
		title: "Meet2 ",
		category: "Work",
		cycles: 2,
		startTime: "17:00",
		gradient: "from-pomodo-orange to-pomodo-red",
	},
	{
		id: 2,
		title: "Email Responses",
		category: "Work",
		cycles: 2,
		startTime: "09:45",
		gradient: "from-pomodo-red to-pomodo-gold",
	},
	{
		id: 3,
		title: "Algorithm Study",
		category: "Study",
		cycles: 4,
		startTime: "11:00",
		gradient: "from-pomodo-gold to-pomodo-orange",
	},
	{
		id: 4,
		title: "Code Review",
		category: "Work",
		cycles: 2,
		startTime: "14:00",
		gradient: "from-pomodo-orange to-pomodo-red",
	},
];

const startTime = Math.min(
	...tasks.map((task) => Number(task.startTime.split(":")[0])),
);

function calculateEndTime(tasks: Array<Task>): number {
	let latest_end_time = 0;
	let last_task = tasks[1];
	if (tasks.length === 0) {
		return startTime + 4;
	} else if (tasks.length > 1) {
		tasks.forEach((task) => {
			const task_start_mins =
				Number(task.startTime.split(":")[0]) * 60 +
				Number(task.startTime.split(":")[1]);
			const task_end_time = task_start_mins + task.cycles * cycleLen;
			if (task_end_time > latest_end_time) {
				latest_end_time = task_end_time;
				last_task = task;
			}
		});
	}
	let end_time =
		Number(last_task.startTime.split(":")[0]) +
		Math.ceil((last_task.cycles * cycleLen) / 60);

	return end_time;
}

const endTime = calculateEndTime(tasks);
const timeBlockAmount = endTime - startTime;

function calculateTaskPos(time: string): number {
	const adjuster = startTime - 1;
	const time_h = Number(time.split(":")[0]);
	const time_m = Number(time.split(":")[1]);

	// percentage of hour minutes represent
	const pos_h = (time_h - adjuster) * (blockHeight * 4);
	return pos_h + (time_m / 60) * blockHeight * 4;
}

// Current time indicator position (in pixels from top)
const currentTimePosition = 200;
</script>

<template>
  <div class="flex flex-col h-full bg-dark-bg relative">
    <!-- Header with Date Navigation -->
    <div class="px-6 py-4 border-b border-dark-border mb-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button class="w-8 h-8 rounded-full border border-pomodo-orange text-pomodo-orange hover:bg-pomodo-orange hover:text-white transition-colors flex items-center justify-center">
            <ChevronLeft :size="16" />
          </button>
          <span class="mt-3 text-lg font-semibold text-pomodo-orange">Today, Sep 1</span>
          <button class="w-8 h-8 rounded-full border border-pomodo-orange text-pomodo-orange hover:bg-pomodo-orange hover:text-white transition-colors flex items-center justify-center">
            <ChevronRight :size="16" />
          </button>
        </div>
        <button class="mt-3 text-pomodo-orange hover:text-pomodo-gold transition-colors">
          <span class="text-sm">Week View</span>
        </button>
      </div>
    </div>

    <!-- Timeline Grid -->
    <div class="flex-1 overflow-auto">
      <div class="flex h-full">
        <!-- Time Column -->
        <div class="w-16 flex-col ">
          <div 
            v-for="time in timeBlockAmount+3" 
            :key="time"
            :class="`h-${blockHeight} flex items-center justify-center text-xs text-text-muted border-b border-dark-border`"
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
            class="absolute w-full h-16 border-b border-dark-border" 
            :style="`top: ${index * (blockHeight*4)}px`"
          ></div>

          <!-- Task Blocks -->
          <button 
            @click="emit('task-details')"
            v-for="task in tasks"
            :key="task.id"
            class="absolute left-4 right-4 rounded-lg p-3 cursor-pointer hover:scale-[1.02] transition-transform shadow-lg text-left"
            :class="`bg-gradient-to-br ${task.gradient}`"
            :style="`top: ${calculateTaskPos(task.startTime)}px; height: ${task.cycles*cycleLen}px;`"
          >
            <h3 class="text-white font-semibold text-sm">{{ `${task.title} - ${task.startTime}` }}</h3>
            <p class="text-white/80 text-xs mt-1">{{ task.cycles }} pomodoros • {{ task.category }}</p>
            <div v-if="task.cycles > 2" class="flex gap-1 mt-2">
              <div 
                v-for="i in task.cycles" 
                :key="i"
                class="w-2 h-2 rounded-full bg-white/30 "
              ></div>
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
      @click="emit('add-task')"
      class="absolute bottom-18 right-6 w-14 h-14 bg-gradient-to-br from-pomodo-orange to-pomodo-red rounded-full text-white shadow-fab hover:shadow-fab-hover hover:scale-110 transition-all flex items-center justify-center"
    >
      <Plus :size="24" />
    </button>

    <!-- Quick Stats Bar -->
    <div class="px-6 py-3 bg-dark-pure border-t border-dark-border">
      <div class="flex justify-around text-xs">
        <div class="text-center">
          <span class="text-text-muted block">Scheduled</span>
          <span class="text-pomodo-orange font-semibold">12 tasks</span>
        </div>
        <div class="text-center">
          <span class="text-text-muted block">Total Time</span>
          <span class="text-pomodo-red font-semibold">7h 30m</span>
        </div>
        <div class="text-center">
          <span class="text-text-muted block">Completed</span>
          <span class="text-green-500 font-semibold">5/12</span>
        </div>
      </div>
    </div>
  </div>
</template>
