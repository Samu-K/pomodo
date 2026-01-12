<script setup lang="ts">
import {
	currentMonitor,
	getCurrentWindow,
	LogicalSize
} from "@tauri-apps/api/window";
import {
	isPermissionGranted,
	requestPermission
} from "@tauri-apps/plugin-notification";
import { useSwipe } from "@vueuse/core";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { type ThemeInstance, useTheme } from "vuetify";
import AppLayout from "./components/AppLayout.vue";
import PremiumModal from "./components/premium/PremiumModal.vue";
import ProjectLimitModal from "./components/premium/ProjectLimitModal.vue";
import CreateTaskModal from "./components/task/CreateTaskModal.vue";
import TaskDetailsModal from "./components/task/TaskDetailsModal.vue";
import AddCategoryDialog from "./components/timer/AddCategoryDialog.vue";
import WelcomeDialog from "./components/WelcomeDialog.vue";
import { RecurrenceType } from "./defines/recur.ts";
import { Task } from "./defines/task.ts";
import { registerShortcuts } from "./funcs/shortcuts";
import { useSettingsStore } from "./stores/settings";
import { useThemeStore } from "./stores/theme";
import { TimerMode, useTimerStore } from "./stores/timer";
import { useUIStore } from "./stores/ui";

const route = useRoute();
const router = useRouter();
const settingsStore = useSettingsStore();
const uiStore = useUIStore();
const themeStore = useThemeStore();
const vuetifyTheme = useTheme();
const isLoading = ref(true);

// Apply theme overrides
watch(
	() => settingsStore.themeOverrides,
	(newOverrides) => {
		if (newOverrides && Object.keys(newOverrides).length > 0) {
			themeStore.applyTheme(newOverrides, vuetifyTheme);
		} else {
			themeStore.resetTheme(vuetifyTheme);
		}
	},
	{ deep: true, immediate: true }
);

// Watch for settings changes to update shortcuts
const toggleTimerSetting = computed(
	() => settingsStore.settings.find((s) => s.key === "Toggle Timer")?.value
);

watch(toggleTimerSetting, async (newValue, oldValue) => {
	if (newValue && newValue !== oldValue) {
		console.log(
			`[App] Toggle timer setting changed from ${oldValue} to ${newValue}, re-registering...`
		);
		await registerShortcuts();
	}
});

// Initialize theme and splashscreen on app mount
// Initial Resize Logic
// Initialize theme and splashscreen on app mount
// Initial Resize Logic
const getSafeWindowSize = async () => {
	try {
		const monitor = await currentMonitor();
		if (!monitor) return new LogicalSize(400, 900);

		const scaleFactor = monitor.scaleFactor;
		const screenHeight = monitor.size.height / scaleFactor;

		// Target height is 900, but clamp to 90% of screen height
		const targetHeight = Math.min(900, screenHeight * 0.9);

		// Ensure we don't go below min height (100 in config)
		const finalHeight = Math.max(100, targetHeight);

		return new LogicalSize(400, finalHeight);
	} catch (e) {
		console.debug("Failed to get monitor info (likely not in Tauri env)", e);
		return new LogicalSize(400, 900);
	}
};

onMounted(async () => {
	// Ensure settings are loaded first
	if (settingsStore.settings.length === 0) {
		await settingsStore.fetchSettings();
	}
	// Initialize theme from settings
	await settingsStore.initTheme();
	const themeWithChange = vuetifyTheme as ThemeInstance & {
		change?: (name: string) => void;
	};
	if (typeof themeWithChange.change === "function") {
		themeWithChange.change(settingsStore.resolvedTheme);
	} else {
		vuetifyTheme.global.name.value = settingsStore.resolvedTheme;
	}

	// Request notification permissions
	const permissionGranted = await isPermissionGranted();
	if (!permissionGranted) {
		await requestPermission();
	}

	// Check for first boot
	const welcomeSeen = localStorage.getItem("pomodo-welcome-seen");
	if (!welcomeSeen) {
		showWelcomeDialog.value = true;
	}

	// Adjust window size on startup
	if (!uiStore.isMiniMode && !uiStore.isMobile) {
		try {
			const safeSize = await getSafeWindowSize();
			await getCurrentWindow().setSize(safeSize);
			await getCurrentWindow().center();
		} catch (e) {
			console.debug("Skiping window resize (likely not in Tauri env)", e);
		}
	}

	isLoading.value = false;

	// Register shortcuts
	await registerShortcuts();
});

// Watch settings store theme and sync Vuetify theme
watch(
	() => settingsStore.resolvedTheme,
	(newTheme) => {
		const themeWithChange = vuetifyTheme as ThemeInstance & {
			change?: (name: string) => void;
		};
		if (typeof themeWithChange.change === "function") {
			themeWithChange.change(newTheme);
		} else {
			vuetifyTheme.global.name.value = newTheme;
		}
	}
);

// Modal states
const showWelcomeDialog = ref(false);
const showCreateTask = ref(false);
const showCreateCategory = ref(false);
const showTaskDetails = ref(false);
const selectedTask = ref<Task>({
	id: 0,
	title: "",
	category: "",
	category_id: null,
	project_id: null,
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
		if (uiStore.isMobile) return;
		try {
			const appWindow = getCurrentWindow();
			if (isMini) {
				await appWindow.setSize(new LogicalSize(320, 150));
				await appWindow.setAlwaysOnTop(true);
				await appWindow.setResizable(false);
			} else {
				const safeSize = await getSafeWindowSize();
				await appWindow.setSize(safeSize);
				await appWindow.setAlwaysOnTop(false);
				await appWindow.setResizable(true);
				await appWindow.center();
			}
		} catch (e) {
			console.debug("Skipping window resize (likely not in Tauri env)", e);
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

const handleWelcomeClose = () => {
	showWelcomeDialog.value = false;
	localStorage.setItem("pomodo-welcome-seen", "true");
};

const handleWelcomeCreateCategories = () => {
	showWelcomeDialog.value = false;
	localStorage.setItem("pomodo-welcome-seen", "true");
	showCreateCategory.value = true;
};

// Swipe Navigation
const tabs = ["/", "/timeline", "/tasks", "/stats"];
useSwipe(document.body, {
	onSwipeEnd(_e: Event, direction: string) {
		if (direction === "left") {
			// Swipe Left -> Go Right (Next Tab)
			if (!showBackButton.value) {
				navigateTabs(1);
			}
		} else if (direction === "right") {
			// Swipe Right -> Go Left (Prev Tab) or Back
			if (showBackButton.value) {
				router.back();
			} else {
				navigateTabs(-1);
			}
		}
	}
});

function navigateTabs(offset: number) {
	const current = route.path;
	const idx = tabs.indexOf(current);
	if (idx === -1) return;

	const newIdx = idx + offset;
	if (newIdx >= 0 && newIdx < tabs.length) {
		router.push(tabs[newIdx]);
	}
}
</script>

<template>
  <AppLayout
    v-if="!isLoading"
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
  <TaskDetailsModal
    v-if="showTaskDetails"
    :selTask="selectedTask"
    @close="showTaskDetails = false"
  />
  <PremiumModal
    v-if="uiStore.showPremiumModal"
    @close="uiStore.setPremiumModal(false)"
  />
  <ProjectLimitModal
    v-if="uiStore.showProjectLimitModal"
    @close="uiStore.setProjectLimitModal(false)"
  />

  <WelcomeDialog
    v-if="showWelcomeDialog"
    @close="handleWelcomeClose"
    @create-categories="handleWelcomeCreateCategories"
  />

  <AddCategoryDialog
    v-model="showCreateCategory"
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
