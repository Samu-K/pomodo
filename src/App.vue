<script setup lang="ts">
import {
	isPermissionGranted,
	requestPermission
} from "@tauri-apps/plugin-notification";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useTheme } from "vuetify";
import AppLayout from "./components/AppLayout.vue";
import SplashScreen from "./components/SplashScreen.vue";
import CreateCategoryModal from "./components/task/CreateCategoryModal.vue";
import CreateTaskModal from "./components/task/CreateTaskModal.vue";
import TaskDetailsModal from "./components/task/TaskDetailsModal.vue";
import { RecurrenceType } from "./defines/recur.ts";
import { Task } from "./defines/task.ts";
import { useSettingsStore } from "./stores/settings";
import { TimerMode, useTimerStore } from "./stores/timer";

const route = useRoute();
const router = useRouter();
const settingsStore = useSettingsStore();
const vuetifyTheme = useTheme();
const isLoading = ref(true);

// Initialize theme on app mount
onMounted(async () => {
	// Ensure settings are loaded first
	if (settingsStore.settings.length === 0) {
		await settingsStore.fetchSettings();
	}
	// Initialize theme from settings
	await settingsStore.initTheme();
	vuetifyTheme.global.name.value = settingsStore.theme;

	// Request notification permissions
	const permissionGranted = await isPermissionGranted();
	if (!permissionGranted) {
		await requestPermission();
	}

	// Minimum splash screen duration of 2 seconds
	await new Promise((resolve) => setTimeout(resolve, 2000));

	isLoading.value = false;
});

// Watch settings store theme and sync Vuetify theme
watch(
	() => settingsStore.theme,
	(newTheme) => {
		vuetifyTheme.global.name.value = newTheme;
	}
);

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
	return false;
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
  <SplashScreen v-if="isLoading" />
  <AppLayout
    v-else
    :header-title="route.name?.toString() || 'Pomodo'"
    :show-back-button="showBackButton"
    :show-settings-button="false"
    :hide-bottom-nav="hideBottomNav"
    @back-click="handleBackClick"
    @add-task="handleAddTask"
    @task-details="openTaskDetails"
  >
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
