<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Minimize2 } from "lucide-vue-next";
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
import MiniTimerView from "./components/MiniTimerView.vue";
import TimerTaskInfo from "./components/TimerTaskInfo.vue";

const uiStore = useUIStore();
const timer = useTimerStore();
const categoryStore = useCategoryStore();
const tasksStore = useTasks();
const projectStore = useProjectStore();

const showTaskManager = ref(false);
const categoryManagerRef = ref<InstanceType<typeof CategoryManager> | null>(
	null
);

const selectedTask = computed(() => {
	if (!timer.taskId) return null;
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
	timer.setProjectId(null);
	if (task.category_id) timer.setCategoryId(task.category_id);
	showTaskManager.value = false;
};

const handleProjectSelect = (projectId: number) => {
	timer.setProjectId(projectId);
	timer.setTaskId(null);
	const project = projectStore.projects.find((p) => p.id === projectId);
	if (project?.category_id) timer.setCategoryId(project.category_id);
	showTaskManager.value = false;
};

const handleTaskClear = () => {
	timer.setTaskId(null);
	timer.setProjectId(null);
	showTaskManager.value = false;
};

onMounted(async () => {
	if (categoryStore.categories.length === 0)
		await categoryStore.fetchCategories();
	if (tasksStore.tasks.length === 0) await tasksStore.fetchTasks();
	if (projectStore.projects.length === 0) await projectStore.fetchProjects();
});

watch(
	() => [timer.isRunning, timer.mode],
	async ([isRunning, mode]) => {
		try {
			if (uiStore.isMobile) {
				if (isRunning && mode === TimerMode.FOCUS)
					await invoke("plugin:keep-screen-on|enable");
				else await invoke("plugin:keep-screen-on|disable");
			}
		} catch (e) {
			console.error("KeepScreenOn error:", e);
		}
	},
	{ immediate: true }
);

const selectedCategory = computed(() => {
	if (!timer.categoryId) return null;
	return (
		categoryStore.categories.find((c) => c.id === timer.categoryId) || null
	);
});

const themeColor = computed(() =>
	timer.mode === TimerMode.FOCUS ? "pomodo-orange" : "green"
);

const { holdProgress, startHold, endHold } = useHoldToPause(() => {
	try {
		invoke("plugin:haptics|impact", { style: "heavy" });
	} catch (e) {}
	timer.pauseTimer();
});

const showCompletionDialog = ref(false);
const showOvertimeDialog = ref(false);

watch(
	() => timer.mode,
	async (newMode, oldMode) => {
		if (oldMode === TimerMode.FOCUS && newMode === TimerMode.REST) {
			await tasksStore.fetchTasks();
			if (
				selectedTask.value &&
				selectedTask.value.completedCycles === selectedTask.value.cycles
			) {
				showCompletionDialog.value = true;
			}
		}
	}
);

const handleCompleteTask = async () => {
	if (selectedTask.value) {
		await tasksStore.completeTaskInstance(selectedTask.value);
		showCompletionDialog.value = false;
		timer.setTaskId(null);
	}
};

const handleAddOvertime = async (amount: number) => {
	if (selectedTask.value && amount > 0) {
		await tasksStore.updateTask(
			{ ...selectedTask.value, cycles: selectedTask.value.cycles + amount },
			false
		);
	}
	showOvertimeDialog.value = false;
};
</script>

<template>
    <div 
        class="flex flex-col h-full relative select-none touch-none transition-colors duration-500"
        :class="[
            timer.isRunning && timer.mode === TimerMode.FOCUS || uiStore.isMiniMode ? '#000000' : 'bg-light-bg dark:bg-dark-bg',
            uiStore.isMiniMode ? '' : '-mt-4'
        ]"
        @mousedown="timer.isRunning && timer.mode === TimerMode.FOCUS ? startHold() : null"
        @touchstart="timer.isRunning && timer.mode === TimerMode.FOCUS ? startHold() : null"
        @mouseup="endHold"
        @touchend="endHold"
        @mouseleave="endHold"
    >
        <div v-if="!uiStore.isMiniMode && timer.isReady && !uiStore.isMobile" class="absolute top-8 right-6 z-20 flex gap-2">
            <button data-testid="toggle-mini-mode" @click="uiStore.toggleMiniMode" class="p-2 text-text-muted hover:text-pomodo-orange transition-colors">
                <Minimize2 :size="24"/>
            </button>
        </div>

        <MiniTimerView 
            v-if="uiStore.isMiniMode"
            :taskId="timer.taskId"
            :projectId="timer.projectId"
            :selectedTaskTitle="selectedTask?.title"
            :selectedProjectName="selectedProject?.name"
            :selectedCategoryName="selectedCategory?.name"
            :formattedTime="timer.formattedTime"
            :themeColor="themeColor"
            :isRunning="timer.isRunning"
            :mode="timer.mode"
            :canStart="timer.mode === TimerMode.REST || !!(timer.taskId || timer.projectId || selectedCategory)"
            @toggle-timer="timer.toggleTimer"
            @toggle-mini-mode="uiStore.toggleMiniMode"
        />

         <template v-else>
            <div class="absolute bottom-0 right-0 top-0 left-0 items-center justify-center flex flex-col pointer-events-none" >
                <div v-if="timer.isRunning && timer.mode === TimerMode.FOCUS"
                    class="bg-dark-bg pointer-events-none z-0 transition-all duration-75 rounded-full"
                    :style="{ width: `${holdProgress*12}px`, height: `${holdProgress*12}px` }"
                ></div>
            </div>
            
            <div v-if="!timer.isReady" class="flex-1 flex items-center justify-center">
                <v-progress-circular data-testid="initial-loader" indeterminate color="primary" />
            </div>

            <div v-else class="flex-1 flex flex-col items-center justify-center px-6 gap-10 z-10">
                <TimerDisplay />
                <TimerTaskInfo 
                    :selectedTask="selectedTask"
                    :selectedProject="selectedProject"
                    :selectedCategory="selectedCategory"
                    :showSelector="!timer.isRunning && timer.percent >= 100"
                    :mode="timer.mode"
                    @open-manager="showTaskManager = true"
                />
                <TaskManager v-if="showTaskManager" :selectedTaskId="timer.taskId"
                    @select="handleTaskSelect" @selectProject="handleProjectSelect" @clear="handleTaskClear"
                    @selectCategory="categoryManagerRef.showDialog = true" @close="showTaskManager = false"
                />
                <div class="absolute" style="width: 0; height: 0; overflow: hidden;">
                    <CategoryManager ref="categoryManagerRef" :selectedCategory="selectedCategory" @select="(cat) => timer.setCategoryId(cat.id)" />
                </div>
                <div v-if="timer.isRunning && timer.mode === TimerMode.FOCUS" class="text-text-muted text-sm animate-pulse">Hold to pause</div>
            </div>

            <div v-if="!(timer.isRunning && timer.mode === TimerMode.FOCUS)">
                <TimerControls :selectedCategory="selectedCategory" :canStart="timer.mode === TimerMode.REST || !!(timer.taskId || timer.projectId || selectedCategory)" />
            </div>

            <TaskCompletionDialog v-model="showCompletionDialog" :task="selectedTask" @confirm="handleCompleteTask" @cancel="showCompletionDialog = false; showOvertimeDialog = true" />
            <OvertimeDialog v-model="showOvertimeDialog" @confirm="handleAddOvertime" />
        </template>
    </div>
</template>
