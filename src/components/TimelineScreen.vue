<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus } from "lucide-vue-next";
import { computed, ref } from "vue";
import { NoRecurrance } from "../interfaces/helpers.ts";
import { Task } from "../interfaces/task.ts";

const emit = defineEmits<{
	"add-task": [];
	"task-details": [task: Task];
}>();

// Sample data
const blockHeight = 16;
const cycleLen = 25;

const tasks: Array<Task> = [
	{
		id: 12,
		title: "Project Review",
		category: "Work",
		cycles: 4,
		startTime: new Date("2025/09/04, 18:00"),
		gradient: "from-pomodo-orange to-pomodo-red",
		recurrance: NoRecurrance,
		completed: false,
	},
	{
		id: 13,
		title: "Project Review",
		category: "Work",
		cycles: 4,
		startTime: new Date("2025/09/05, 18:00"),
		gradient: "from-pomodo-orange to-pomodo-red",
		completed: true,
		recurrance: NoRecurrance,
	},
	{
		id: 13,
		title: "Relax",
		category: "School",
		cycles: 2,
		startTime: new Date("2025/09/05, 20:30"),
		gradient: "from-pomodo-orange to-pomodo-red",
		completed: false,
		recurrance: NoRecurrance,
	},
	{
		id: 11,
		title: "Meet2 ",
		category: "Work",
		cycles: 2,
		startTime: new Date("2025/09/04, 17:00"),
		gradient: "from-pomodo-orange to-pomodo-red",
		completed: false,
		recurrance: NoRecurrance,
	},
	{
		id: 2,
		title: "Email Responses",
		category: "Work",
		cycles: 2,
		startTime: new Date("2025/09/04, 09:45"),
		gradient: "from-pomodo-red to-pomodo-gold",
		completed: true,
		recurrance: NoRecurrance,
	},
	{
		id: 3,
		title: "Algorithm Study",
		category: "Study",
		cycles: 4,
		startTime: new Date("2025/09/04, 11:00"),
		gradient: "from-pomodo-gold to-pomodo-orange",
		completed: true,
		recurrance: NoRecurrance,
	},
	{
		id: 4,
		title: "Code Review",
		category: "Work",
		cycles: 2,
		startTime: new Date("2025/04/09, 14:00"),
		gradient: "from-pomodo-orange to-pomodo-red",
		completed: false,
		recurrance: NoRecurrance,
	},
];

const tasksForSelectedDate = computed(() => {
	console.log("Filtering tasks");
	if (!selectedDate.value) return [];

	const filtTasks = tasks.filter(
		(task) =>
			task.startTime.toDateString() === selectedDate.value.toDateString(),
	);
	console.log(filtTasks);
	return filtTasks;
});

const startTime = Math.min(...tasks.map((task) => task.startTime.getHours()));
const isDateToday = (): boolean => {
	const res = selectedDate.value.toDateString() === new Date().toDateString();

	return res;
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
		return total + (task.cycles * cycleLen) / 60;
	}, 0);
	return formatTime(totalTime);
};

function calculateEndTime(tasks: Array<Task>): number {
	let latest_end_time = 0;
	let last_task = tasks[1];
	if (tasks.length === 0) {
		return startTime + 4;
	} else if (tasks.length > 1) {
		tasks.forEach((task) => {
			const task_start_mins =
				task.startTime.getMinutes() + task.startTime.getHours() * 60;
			const task_end_time = task_start_mins + task.cycles * cycleLen;
			if (task_end_time > latest_end_time) {
				latest_end_time = task_end_time;
				last_task = task;
			}
		});
	}
	let end_time =
		last_task.startTime.getHours() +
		Math.ceil((last_task.cycles * cycleLen) / 60);

	return end_time;
}

const endTime = calculateEndTime(tasks);
const timeBlockAmount = endTime - startTime;
const selectedDate = ref<Date>(new Date());

// Current time indicator position (in pixels from top)
const currentTimePosition =
	(selectedDate.value.getHours() -
		startTime +
		1 +
		selectedDate.value.getMinutes() / 60) *
	blockHeight *
	4;

function calculateTaskPos(time: Date): number {
	const adjuster = startTime - 1;

	// percentage of hour minutes represent
	const pos_h = (time.getHours() - adjuster) * (blockHeight * 4);
	return pos_h + (time.getMinutes() / 60) * blockHeight * 4;
}

const goToPrevDate = () => {
	const newDate = new Date();
	newDate.setDate(selectedDate.value.getDate() - 1);
	selectedDate.value = newDate;
};
const goToNextDate = () => {
	const newDate = new Date();
	newDate.setDate(selectedDate.value.getDate() + 1);
	selectedDate.value = newDate;
};
</script>

<template>
  <div class="flex flex-col h-full bg-dark-bg relative">
    <!-- Header with Date Navigation -->
    <div class="px-6 py-4 border-b border-dark-border mb-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button class="w-8 h-8 rounded-full border border-pomodo-orange text-pomodo-orange hover:bg-pomodo-orange hover:text-white transition-colors flex items-center justify-center"
            @click="goToPrevDate"
          >
            <ChevronLeft :size="16" />
          </button>
          <span class="mt-3 text-lg font-semibold text-pomodo-orange">
            <div class="flex">
              <p v-if="isDateToday()">
                Today
              </p>
              <p
                v-else
              >
                {{ selectedDate.toLocaleString().split(",")[0]}}
              </p>
            </div>
          </span>
          <button class="w-8 h-8 rounded-full border border-pomodo-orange text-pomodo-orange hover:bg-pomodo-orange hover:text-white transition-colors flex items-center justify-center"
            @click="goToNextDate"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
        <button class="mt-3 text-pomodo-orange hover:text-pomodo-gold transition-colors"
          @click='selectedDate = new Date()'
        >
          <span class="text-sm">Today</span>
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
            @click="emit('task-details', task)"
            :disabled="task.completed"
            v-for="task in tasksForSelectedDate"
            :key="task.id"
            class="absolute left-4 right-4 rounded-lg p-3 cursor-pointer hover:scale-[1.02] transition-transform shadow-lg text-left"
            :class="[
              `bg-gradient-to-br ${task.gradient}`,
              { 'opacity-50': task.completed }
            ]"
            :style="`top: ${calculateTaskPos(task.startTime)}px; height: ${task.cycles*cycleLen}px;`"
          >
            <h3 class="text-white font-semibold text-sm">{{ `${task.title} - ${task.startTime.toTimeString().slice(0, 5)}`}}</h3>
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
          <span class="text-pomodo-orange font-semibold">{{tasksForSelectedDate.length}}</span>
        </div>
        <div class="text-center">
          <span class="text-text-muted block">Total Time</span>
          <span class="text-pomodo-red font-semibold">{{tasksLen(tasksForSelectedDate)}}</span>
        </div>
        <div class="text-center">
          <span class="text-text-muted block">Completed</span>
          <span class="text-green-500 font-semibold">{{tasksForSelectedDate.filter((task) => {return task.completed;}).length}}</span>
        </div>
      </div>
    </div>
  </div>
</template>
