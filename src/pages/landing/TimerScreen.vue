<script setup lang="ts">
import { Pause, Play, RotateCcw, SkipForward } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import CategoryManager from "../../components/timer/CategoryManager.vue";
import TaskManager from "../../components/timer/TaskManager.vue";
import type { Task } from "../../defines/task";
import { useCategoryStore } from "../../stores/categories";
import { useSettingsStore } from "../../stores/settings";
import { useTasks } from "../../stores/task";
import { useThemeStore } from "../../stores/theme";
import { TimerMode, useTimerStore } from "../../stores/timer";

const timer = useTimerStore();
const categoryStore = useCategoryStore();
const themeStore = useThemeStore();
const settingsStore = useSettingsStore();
const tasksStore = useTasks();

const showTaskManager = ref(false);
const categoryManagerRef = ref<InstanceType<typeof CategoryManager> | null>(
	null
);

const handleSelectCategory = () => {
	// Open category manager dialog programmatically
	if (categoryManagerRef.value?.showDialog !== undefined) {
		categoryManagerRef.value.showDialog = true;
	}
};

const selectedTask = computed(() => {
	if (!timer.taskId) return null;
	// Try to find in expanded tasks first (most likely for Today)
	return (
		tasksStore.expandedTasks.find((t) => t.id === timer.taskId) ||
		tasksStore.tasks.find((t) => t.id === timer.taskId) ||
		null
	);
});

const handleTaskSelect = (task: Task) => {
	timer.setTaskId(task.id);
	if (task.category_id) {
		timer.setCategoryId(task.category_id);
	}
	showTaskManager.value = false;
};

const handleTaskClear = () => {
	timer.setTaskId(null);
	showTaskManager.value = false;
};

const isDark = computed(() => settingsStore.theme === "dark");

onMounted(async () => {
	if (categoryStore.categories.length === 0) {
		await categoryStore.fetchCategories();
	}
	if (tasksStore.tasks.length === 0) {
		await tasksStore.fetchTasks();
	}
});

const selectedCategory = computed(() => {
	if (!timer.categoryId) return null;
	return (
		categoryStore.categories.find((c) => c.id === timer.categoryId) || null
	);
});

const themeColor = computed(() =>
	timer.mode === TimerMode.FOCUS ? "pomodo-orange" : "green"
);

const showCategorySelector = computed(() => {
	// Only show selector if timer is NOT running AND is fully reset
	return !timer.isRunning && timer.percent >= 100;
});

const allowSkip = computed(() => {
	if (timer.mode === TimerMode.REST) return true;
	// Focus mode: only if paused
	return !timer.isRunning;
});

const allowReset = computed(() => {
	if (timer.mode === TimerMode.REST) return false;
	// Focus mode: only if paused
	return !timer.isRunning && timer.percent < 100;
});

const categoryStyle = computed(() => {
	const color = selectedCategory.value?.color;
	const pomodoOrange = themeStore.getColor("pomodo.orange") || "#FF6B35";

	if (!color) {
		// No category color - use pomodo orange as default
		return {
			backgroundColor: themeStore.hexToRgba(pomodoOrange, 0.15),
			color: pomodoOrange,
			borderColor: themeStore.hexToRgba(pomodoOrange, 0.3)
		};
	}

	// Resolve color using theme store (handles both hex and legacy names)
	const hexColor = themeStore.resolveColor(color);

	// Convert to rgba for backgrounds
	return {
		backgroundColor: themeStore.hexToRgba(hexColor, 0.15),
		color: hexColor,
		borderColor: themeStore.hexToRgba(hexColor, 0.3)
	};
});

// Hold to pause logic
const holdProgress = ref(0);
let holdInterval: number | undefined;
const HOLD_DURATION = 3000; // 3 seconds
const UPDATE_INTERVAL = 50; // Update every 50ms

const isFocusRunning = computed(
	() => timer.isRunning && timer.mode === TimerMode.FOCUS
);

const startHold = () => {
	if (!isFocusRunning.value) return;

	holdProgress.value = 0;
	holdInterval = window.setInterval(() => {
		holdProgress.value += (UPDATE_INTERVAL / HOLD_DURATION) * 100;

		if (holdProgress.value >= 100) {
			completeHold();
		}
	}, UPDATE_INTERVAL);
};

const endHold = () => {
	if (holdInterval) {
		clearInterval(holdInterval);
		holdInterval = undefined;
	}
	holdProgress.value = 0;
};

const completeHold = () => {
	endHold();
	timer.pauseTimer();
};

defineExpose({
	holdProgress
});
</script>

<template>
    <div 
        class="flex flex-col h-full relative select-none touch-none transition-colors duration-500 -mt-4"
        :class="isFocusRunning ? 'bg-black' : 'bg-light-bg dark:bg-dark-bg'"
        @mousedown="startHold"
        @touchstart="startHold"
        @mouseup="endHold"
        @touchend="endHold"
        @mouseleave="endHold"
    >
        <!-- Hold Progress Overlay, Circle that starts from middle of screen-->
         <div class="absolute bottom-0 right-0 top-0 left-0 items-center justify-center flex flex-col" >
            <div 
                v-if="isFocusRunning"
                class="bg-dark-bg pointer-events-none z-0 transition-all duration-75 rounded-full"
                :style="{ width: `${holdProgress*12}px`, height: `${holdProgress*12}px` }"
            ></div>
         </div>
        
        <div v-if="!timer.isReady" class="flex-1 flex items-center justify-center">
             <v-progress-circular indeterminate color="primary" />
        </div>

        <div v-else class="flex-1 flex flex-col items-center justify-center px-6 gap-10 z-10">
      <div v-if="!isFocusRunning" class="flex gap-3 mb-2">
        <div 
            v-for="i in timer.long_break_interval" 
            :key="i"
            class="w-3 h-3 rounded-full border border-pomodo-orange transition-all duration-300"
            :class="{
                'bg-pomodo-orange': i <= timer.sessionStreak,
                'bg-transparent': i > timer.sessionStreak
            }"
        ></div>
      </div>
            <v-progress-circular 
                :model-value="timer.percent" 
                :color="themeColor" 
                :size="170" 
                width="10" 
                z-index='2'
            ></v-progress-circular>

            <div :class="(`-mb-12 text-2xl text-${themeColor}`)">
                {{ timer.mode === TimerMode.FOCUS ? 'FOCUS' : 'REST' }}
            </div>

            <div :class="(`text-timer text-${themeColor} mt-12`)">
                {{ timer.formattedTime }}
            </div>

            <div class="w-72 h-22 mb-8 flex justify-center" v-if="timer.mode === TimerMode.FOCUS">
                <!-- Show task/category info if selected, otherwise show "Select Focus" button -->
                <v-btn 
                     @click="showTaskManager = true" 
                     variant="outlined"
                     :color="selectedCategory?.color || 'orange'"
                     class="px-6 py-3 mx-auto block"
                     :class="showCategorySelector ? '' : '-mt-5'">
                    <template v-if="timer.taskId && selectedTask">
                        <span class="font-semibold tracking-wider">{{ selectedTask.title }}</span>
                    </template>
                    <template v-else-if="selectedCategory">
                        <span class="font-medium tracking-wide">{{ selectedCategory.name }}</span>
                    </template>
                    <template v-else>
                        <span>Select Focus</span>
                    </template>
                </v-btn>
            </div>
            
            <TaskManager 
                v-if="showTaskManager" 
                :selectedTaskId="timer.taskId"
                @select="handleTaskSelect" 
                @clear="handleTaskClear"
                @selectCategory="handleSelectCategory"
                @close="showTaskManager = false"
            />
            
            <div class="absolute" style="width: 0; height: 0; overflow: hidden;">
                <CategoryManager 
                    ref="categoryManagerRef"
                    :selectedCategory="selectedCategory"
                    @select="(cat) => timer.setCategoryId(cat.id)"
                />
            </div>
            
            <div v-if="isFocusRunning" class="text-text-muted text-sm animate-pulse">
                Hold to pause
            </div>
        </div>

        <div v-if="!isFocusRunning" class="flex items-center justify-center gap-8 w-full pb-8 z-10">
            <button 
                @click="timer.resetTimer"
                class="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                :class="[
                    isDark 
                        ? 'bg-dark-surface border border-dark-border text-text-secondary' 
                        : 'bg-transparent border-[3px] border-black text-black'
                ]"
                :disabled="!allowReset"
            >
                <RotateCcw :size="20" :class="{'opacity-50': !allowReset}"/>
            </button>
            
            <button 
                @click="timer.toggleTimer"
                :disabled="timer.mode === TimerMode.FOCUS && !selectedCategory"
                class="w-20 h-20 rounded-full text-white flex items-center justify-center transition-transform"
                :class="[
                    {'bg-gradient-to-br from-pomodo-orange to-pomodo-red': !timer.isRunning && timer.mode === TimerMode.FOCUS && selectedCategory},
                    {'bg-gradient-to-br from-green-400 to-green-700': !timer.isRunning && timer.mode === TimerMode.REST},
                    {'bg-gradient-to-br from-gray-600 to-black': timer.isRunning},
                    {'bg-gradient-to-br from-gray-900 to-black opacity-70': timer.mode === TimerMode.FOCUS && !selectedCategory},
                    {'hover:scale-105 shadow-fab hover:shadow-fab-hover': !timer.isRunning && (timer.mode === TimerMode.REST || selectedCategory)}
                ]"
            >
                <Pause :size="32" v-if="timer.isRunning"/>
                <Play :size="32" v-else/>
            </button>
            
            <button 
                class="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                :class="[
                    {'opacity-50': !allowSkip},
                    isDark 
                        ? 'bg-dark-surface border border-dark-border text-text-secondary' 
                        : 'bg-transparent border-[3px] border-black text-black'
                ]"
                :disabled="!allowSkip"
                @click="timer.skip"
            >
                <SkipForward :size="20" />
            </button>
        </div>
    </div>
</template>
