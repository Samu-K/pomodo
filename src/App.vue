<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppLayout from "./components/AppLayout.vue";
import CreateCategoryModal from "./components/task/CreateCategoryModal.vue";
import CreateTaskModal from "./components/task/CreateTaskModal.vue";
import TaskDetailsModal from "./components/task/TaskDetailsModal.vue";
import { RecurrenceType } from "./defines/recur.ts";
import { Task } from "./defines/task.ts";
import { TimerMode, useTimerStore } from "./stores/timer";

const route = useRoute();
const router = useRouter();

// Modal states
const showCreateTask = ref(false);
const showCreateCategory = ref(false);
const showTaskDetails = ref(false);
const selectedTask = ref<Task>({
	id: 0,
	title: "",
	category: "",
	cycles: 0,
	startTime: new Date(),
	gradient: "",
	completed: false,
	recurrence: {
		type: RecurrenceType.NONE
	}
});

const timer = useTimerStore();

const hideBottomNav = computed(() => {
	return timer.isRunning && timer.mode === TimerMode.FOCUS;
});

const showBackButton = computed(() => {
	return route.path === "/settings" || route.path === "/stats/log";
});

const handleBackClick = () => {
	router.back();
};

// Handle FAB click from timeline
const handleAddTask = () => {
	showCreateTask.value = true;
};

const openTaskDetails = (task: Task) => {
	showTaskDetails.value = true;
	selectedTask.value = task;
};
</script>

<template>
  <AppLayout
    :header-title="route.name?.toString() || 'Pomodo'"
    :show-back-button="showBackButton"
    :show-settings-button="false"
    :hide-bottom-nav="hideBottomNav"
    @back-click="handleBackClick"
    @add-task="handleAddTask"
    @task-details="openTaskDetails"
  >
    <!-- Content rendered by AppLayout via router-view -->
  </AppLayout>
  
  <!-- Modals -->
  <CreateTaskModal 
    v-if="showCreateTask" 
    @close="showCreateTask = false"
  />
  <CreateCategoryModal 
    v-if="showCreateCategory"
    @close="showCreateCategory = false"
  />
  <TaskDetailsModal
    v-if="showTaskDetails"
    :selTask="selectedTask"
    @close="showTaskDetails = false"
  />
</template>
