<script setup lang="ts">
import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWindow } from "@tauri-apps/api/window";
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
import { useUIStore } from "./stores/ui";

const route = useRoute();
const router = useRouter();
const settingsStore = useSettingsStore();
const uiStore = useUIStore();
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
	vuetifyTheme.global.name.value = settingsStore.resolvedTheme;

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
	() => settingsStore.resolvedTheme,
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
	category_id: null,
	cycles: 0,
	startTime: new Date(),
	gradient: "",
	completed: false,
	completedCycles: 0,
	recurrence: {
		type: RecurrenceType.NONE
	}
});

const timer = useTimerStore();

watch(
	[() => timer.isRunning, () => timer.mode],
	([isRunning, mode]) => {
		if (isRunning && mode === TimerMode.FOCUS) {
			document.body.classList.add("focus-mode");
		} else {
			document.body.classList.remove("focus-mode");
		}
	},
	{ immediate: true }
);

watch(
	() => uiStore.isMiniMode,
	async (isMini) => {
		const appWindow = getCurrentWindow();
		if (isMini) {
			await appWindow.setSize(new LogicalSize(320, 150));
			await appWindow.setAlwaysOnTop(true);
			await appWindow.setResizable(false);
		} else {
			await appWindow.setSize(new LogicalSize(400, 900));
			await appWindow.setAlwaysOnTop(false);
			await appWindow.setResizable(true);
			await appWindow.center();
		}
	}
);

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
    :is-mini-mode="uiStore.isMiniMode"
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

  <!-- Global Error Notification -->
  <v-snackbar
    :model-value="!!uiStore.errorMessage"
    color="error"
    location="top"
    :timeout="5000"
    @update:model-value="(val) => !val && uiStore.clearError()"
  >
    {{ uiStore.errorMessage }}
    <template #actions>
      <v-btn
        variant="text"
        @click="uiStore.clearError()"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
</template>
