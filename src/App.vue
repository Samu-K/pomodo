<script setup lang="ts">
import { LogicalSize } from "@tauri-apps/api/dpi";
import { currentMonitor, getCurrentWindow } from "@tauri-apps/api/window";
import {
	isPermissionGranted,
	requestPermission
} from "@tauri-apps/plugin-notification";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { type ThemeInstance, useTheme } from "vuetify";
import AppLayout from "./components/AppLayout.vue";
import PremiumModal from "./components/premium/PremiumModal.vue";
import ProjectLimitModal from "./components/premium/ProjectLimitModal.vue";
import CreateTaskModal from "./components/task/CreateTaskModal.vue";
import TaskDetailsModal from "./components/task/TaskDetailsModal.vue";
import AddCategoryDialog from "./components/timer/AddCategoryDialog.vue";
import WelcomeDialog from "./components/WelcomeDialog.vue";
import { useNavigation } from "./composables/useNavigation";
import { useThemeSync } from "./composables/useThemeSync";
import { useWindowManagement } from "./composables/useWindowManagement";
import { RecurrenceType } from "./defines/recur.ts";
import { Task } from "./defines/task.ts";
import { commands } from "./funcs/commands";
import { registerShortcuts } from "./funcs/shortcuts";
import { useAuthStore } from "./stores/auth";
import { useSettingsStore } from "./stores/settings";
import { TimerMode, useTimerStore } from "./stores/timer";
import { useUIStore } from "./stores/ui";

const route = useRoute();

const settingsStore = useSettingsStore();
const uiStore = useUIStore();
const authStore = useAuthStore();

const vuetifyTheme = useTheme();
const timer = useTimerStore();
const isLoading = ref(true);

// Composables
useThemeSync();
const { initializeWindow } = useWindowManagement();
useNavigation();

onMounted(async () => {
	if (settingsStore.settings.length === 0) await settingsStore.fetchSettings();
	await settingsStore.initTheme();

	const permissionGranted = await isPermissionGranted();
	if (!permissionGranted) await requestPermission();

	if (!localStorage.getItem("pomodo-welcome-seen"))
		showWelcomeDialog.value = true;

	await initializeWindow();
	await registerShortcuts();

    // Check for periodic background sync
    await taskStore.checkPeriodicICalSync();

	isLoading.value = false;
});

const toggleTimerSetting = computed(
	() => settingsStore.settings.find((s) => s.key === "Toggle Timer")?.value
);
watch(toggleTimerSetting, async (nv, ov) => {
	if (nv && nv !== ov) await registerShortcuts();
});

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

	await registerShortcuts();

	// Check for Cloud Updates
	if (authStore.isAuthenticated) {
		try {
			const lastRestoreKey = "pomodo-last-auto-restore";
			const now = Date.now();
			const lastRestore = parseInt(
				localStorage.getItem(lastRestoreKey) || "0",
				10
			);

			// Cooldown of 10 seconds to prevent infinite loops if local clock is skewed
			if (now - lastRestore > 10000) {
				const hasUpdate = await authStore.checkUpdates();
				if (hasUpdate) {
					console.log("Auto-restoring cloud backup...");
					localStorage.setItem(lastRestoreKey, Date.now().toString());

					isLoading.value = true;
					await authStore.restore();
					window.location.reload();
				}
			}
			const debugMsg = await commands.supabaseTestConnection();
			console.log("[Supabase Debug]", debugMsg);
		} catch (e) {
			console.error("Failed to check for updates:", e);
		}
	}
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
	recurrence: { type: RecurrenceType.NONE }
});

const hideBottomNav = computed(
	() => timer.isRunning && timer.mode === TimerMode.FOCUS
);

const saveWelcomeSeen = () => {
	localStorage.setItem("pomodo-welcome-seen", "true");
};
</script>

<template>
  <AppLayout
    v-if="!isLoading"
    :header-title="route.name?.toString() || 'Pomodo'"
    :show-back-button="false"
    :show-settings-button="false"
    :hide-bottom-nav="hideBottomNav"
    :is-mini-mode="uiStore.isMiniMode"
    @add-task="showCreateTask = true"
    @task-details="(task) => { selectedTask = task; showTaskDetails = true; }"
  >
  </AppLayout>
  
  <!-- Modals -->
  <CreateTaskModal v-if="showCreateTask" @close="showCreateTask = false" />
  <TaskDetailsModal v-if="showTaskDetails" :selTask="selectedTask" @close="showTaskDetails = false" />
  <PremiumModal v-if="uiStore.showPremiumModal" @close="uiStore.setPremiumModal(false)" />
  <ProjectLimitModal v-if="uiStore.showProjectLimitModal" @close="uiStore.setProjectLimitModal(false)" />
  <WelcomeDialog v-if="showWelcomeDialog" @close="showWelcomeDialog = false; saveWelcomeSeen()"
    @create-categories="showWelcomeDialog = false; saveWelcomeSeen(); showCreateCategory = true"
  />
  <AddCategoryDialog v-model="showCreateCategory" />

  <!-- Global Error Notification -->
  <v-snackbar
    :model-value="!!uiStore.errorMessage"
    color="error" location="top" :timeout="5000"
    @update:model-value="(val) => !val && uiStore.clearError()"
  >
    {{ uiStore.errorMessage }}
    <template #actions>
      <v-btn variant="text" @click="uiStore.clearError()">Close</v-btn>
    </template>
  </v-snackbar>

  <!-- Global Success Notification -->
  <v-snackbar
    :model-value="!!uiStore.successMessage"
    color="success"
    location="top"
    :timeout="3000"
    @update:model-value="(val) => !val && (uiStore.successMessage = null)"
  >
    {{ uiStore.successMessage }}
    <template #actions>
      <v-btn
        variant="text"
        @click="uiStore.successMessage = null"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>

</template>
