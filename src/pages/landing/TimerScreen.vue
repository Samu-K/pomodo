<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Maximize2, Minimize2, Pause, Play } from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import CategoryManager from "../../components/timer/CategoryManager.vue";
import OvertimeDialog from "../../components/timer/OvertimeDialog.vue";
import TaskCompletionDialog from "../../components/timer/TaskCompletionDialog.vue";
import TaskManager from "../../components/timer/TaskManager.vue";
import TimerControls from "../../components/timer/TimerControls.vue";
import TimerDisplay from "../../components/timer/TimerDisplay.vue";
import { useHoldToPause } from "../../composables/useHoldToPause";
import type { Task } from "../../defines/task";
import { useCategoryStore } from "../../stores/categories";
import { useProjectStore } from "../../stores/project";
import { useTasks } from "../../stores/task";
import { TimerMode, useTimerStore } from "../../stores/timer";
import { useUIStore } from "../../stores/ui";

const uiStore = useUIStore();
const timer = useTimerStore();
const categoryStore = useCategoryStore();

const tasksStore = useTasks();
const projectStore = useProjectStore();

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

const selectedProject = computed(() => {
	if (!timer.projectId) return null;
	return projectStore.projects.find((p) => p.id === timer.projectId) || null;
});

const handleTaskSelect = (task: Task) => {
	timer.setTaskId(task.id);
	timer.setProjectId(null); // Clear project when task is selected
	if (task.category_id) {
		timer.setCategoryId(task.category_id);
	}
	showTaskManager.value = false;
};

const handleProjectSelect = (projectId: number) => {
	timer.setProjectId(projectId);
	timer.setTaskId(null); // Clear task when project is selected
	const project = projectStore.projects.find((p) => p.id === projectId);
	if (project?.category_id) {
		timer.setCategoryId(project.category_id);
	}
	showTaskManager.value = false;
};

const handleTaskClear = () => {
	timer.setTaskId(null);
	timer.setProjectId(null);
	showTaskManager.value = false;
};

onMounted(async () => {
	if (categoryStore.categories.length === 0) {
		await categoryStore.fetchCategories();
	}
	if (tasksStore.tasks.length === 0) {
		await tasksStore.fetchTasks();
	}
	if (projectStore.projects.length === 0) {
		await projectStore.fetchProjects();
	}
});

// Keep Screen On Logic
watch(
	() => [timer.isRunning, timer.mode],
	async ([isRunning, mode]) => {
		try {
			if (uiStore.isMobile) {
				if (isRunning && mode === TimerMode.FOCUS) {
					await invoke("plugin:keep-screen-on|enable");
				} else {
					await invoke("plugin:keep-screen-on|disable");
				}
			}
		} catch (e) {
			console.error("KeepScreenOn error:", e);
		}
	},
	{ immediate: true }
);

// Haptics Helper
const haptic = async (style: "light" | "medium" | "heavy" = "medium") => {
	try {
		await invoke("plugin:haptics|impact", { style });
	} catch (e) {
		// Ignore errors (e.g. on desktop)
	}
};

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

const isFocusRunning = computed(
	() => timer.isRunning && timer.mode === TimerMode.FOCUS
);

// Hold to pause logic
const { holdProgress, startHold, endHold } = useHoldToPause(() => {
	haptic("heavy");
	timer.pauseTimer();
});

const handleStartHold = () => {
	if (isFocusRunning.value) {
		startHold();
	}
};

const showCompletionDialog = ref(false);
const showOvertimeDialog = ref(false);

watch(
	() => timer.mode,
	async (newMode, oldMode) => {
		if (oldMode === TimerMode.FOCUS && newMode === TimerMode.REST) {
			// Just finished a focus session
			await tasksStore.fetchTasks();

			if (selectedTask.value) {
				// Check if we reached the goal
				// Note: fetchTasks already calculates completedCycles which includes the one we just finished in DB
				if (selectedTask.value.completedCycles === selectedTask.value.cycles) {
					showCompletionDialog.value = true;
				}
			}
		}
	}
);

const handleCompleteTask = async () => {
	if (selectedTask.value) {
		await tasksStore.completeTaskInstance(selectedTask.value);
		showCompletionDialog.value = false;
		timer.setTaskId(null); // Clear task after completion
	}
};

const handleNotComplete = () => {
	showCompletionDialog.value = false;
	showOvertimeDialog.value = true;
};

const handleAddOvertime = async (amount: number) => {
	if (selectedTask.value) {
		if (amount > 0) {
			await tasksStore.updateTask(
				{
					...selectedTask.value,
					cycles: selectedTask.value.cycles + amount
				},
				false
			);
		}
		// If amount is 0 (Don't know), just close dialog.
		showOvertimeDialog.value = false;
	}
};

defineExpose({
	holdProgress
});
</script>

<template>
    <div 
        class="flex flex-col h-full relative select-none touch-none transition-colors duration-500"
        :class="[
            isFocusRunning || uiStore.isMiniMode ? '#000000' : 'bg-light-bg dark:bg-dark-bg',
            uiStore.isMiniMode ? '' : '-mt-4'
        ]"
        @mousedown="handleStartHold"
        @touchstart="handleStartHold"
        @mouseup="endHold"
        @touchend="endHold"
        @mouseleave="endHold"
    >
        <!-- Settings and Mini View Toggle -->
        <div v-if="!uiStore.isMiniMode && timer.isReady && !uiStore.isMobile" class="absolute top-8 right-6 z-20 flex gap-2">
            <button data-testid="toggle-mini-mode" @click="uiStore.toggleMiniMode" class="p-2 text-text-muted hover:text-pomodo-orange transition-colors">
                <Minimize2 :size="24"/>
            </button>
        </div>

        <!-- Mini mode view -->
        <div 
            v-if="uiStore.isMiniMode"
            class="flex flex-row items-center justify-between px-6 bg-black h-full w-full overflow-hidden border border-dark-border"
        >
            <div class="flex flex-col flex-1 min-w-0 justify-center">
                <div class="text-[10px] uppercase tracking-wider text-text-muted truncate mb-0.5" v-if="timer.taskId && selectedTask">
                    {{ selectedTask.title }}
                </div>
                <div class="text-[10px] uppercase tracking-wider text-text-muted truncate mb-0.5" v-else-if="timer.projectId && selectedProject">
                    {{ selectedProject.name }}
                </div>
                <div class="text-[10px] uppercase tracking-wider text-text-muted truncate mb-0.5" v-else-if="selectedCategory">
                    {{ selectedCategory.name }}
                </div>
                <div :class="`text-4xl font-mono font-bold text-${themeColor}`">
                    {{ timer.formattedTime }}
                </div>
            </div>
            
            <div class="flex items-center gap-3">
                 <button 
                    data-testid="mini-toggle-timer"
                    @click="timer.toggleTimer"
                    :disabled="timer.mode === TimerMode.FOCUS && !selectedCategory"
                    class="p-2 rounded-full flex items-center justify-center transition-colors"
                    :class="`bg-${themeColor}/10 text-${themeColor}`"
                >
                    <Pause :size="24" v-if="timer.isRunning"/>
                    <Play :size="24" v-else/>
                </button>
                <button data-testid="mini-maximize" @click="uiStore.toggleMiniMode" class="p-2 text-text-muted hover:text-white">
                    <Maximize2 :size="20"/>
                </button>
            </div>
        </div>

        <!-- Normal view content -->
         <template v-else>
            <!-- Hold Progress Overlay, Circle that starts from middle of screen-->
            <div class="absolute bottom-0 right-0 top-0 left-0 items-center justify-center flex flex-col pointer-events-none" >
                <div 
                    v-if="isFocusRunning"
                    class="bg-dark-bg pointer-events-none z-0 transition-all duration-75 rounded-full"
                    :style="{ width: `${holdProgress*12}px`, height: `${holdProgress*12}px` }"
                ></div>
            </div>
            
            <div v-if="!timer.isReady" class="flex-1 flex items-center justify-center">
                <v-progress-circular data-testid="initial-loader" indeterminate color="primary" />
            </div>

            <div v-else class="flex-1 flex flex-col items-center justify-center px-6 gap-10 z-10">
                <TimerDisplay />

                <div class="w-72 h-22 mb-8 flex justify-center" v-if="timer.mode === TimerMode.FOCUS">
                    <!-- Show task/category info as text when running, or as button when reset -->
                    <template v-if="showCategorySelector">
                        <v-btn 
                            data-testid="task-selector"
                            @click="showTaskManager = true" 
                            variant="outlined"
                            :color="selectedCategory?.color || 'orange'"
                            class="px-6 mx-auto block">
                            <template v-if="timer.taskId && selectedTask">
                                <span class="font-semibold tracking-wider">{{ selectedTask.title }}</span>
                            </template>
                            <template v-else-if="timer.projectId && selectedProject">
                                <span class="font-semibold tracking-wider">{{ selectedProject.name }}</span>
                            </template>
                            <template v-else-if="selectedCategory">
                                <span class="font-medium tracking-wide">{{ selectedCategory.name }}</span>
                            </template>
                            <template v-else>
                                <span>Select Task</span>
                            </template>
                        </v-btn>
                    </template>
                    <template v-else>
                        <span 
                            class="-mt-5 text-sm font-medium tracking-wide uppercase"
                            :style="{ color: selectedCategory?.color || 'var(--pomodo-orange)' }">
                            <template v-if="timer.taskId && selectedTask">
                                {{ selectedTask.title }}
                            </template>
                            <template v-else-if="timer.projectId && selectedProject">
                                {{ selectedProject.name }}
                            </template>
                            <template v-else-if="selectedCategory">
                                {{ selectedCategory.name }}
                            </template>
                        </span>
                    </template>
                </div>
                
                <TaskManager 
                    v-if="showTaskManager" 
                    :selectedTaskId="timer.taskId"
                    @select="handleTaskSelect" 
                    @selectProject="handleProjectSelect"
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

            <div v-if="!isFocusRunning">
                <TimerControls 
                    :selectedCategory="selectedCategory" 
                    :canStart="timer.mode === TimerMode.REST || !!(timer.taskId || timer.projectId || selectedCategory)"
                />
            </div>

            <!-- Task Completion Dialog -->
            <TaskCompletionDialog
                v-model="showCompletionDialog"
                :task="selectedTask"
                @confirm="handleCompleteTask"
                @cancel="handleNotComplete"
            />

            <!-- Overtime Dialog -->
            <OvertimeDialog
                v-model="showOvertimeDialog"
                @confirm="handleAddOvertime"
            />
        </template>
    </div>
</template>
