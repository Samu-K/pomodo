<script setup lang="ts">
import { Window } from "@tauri-apps/api/window";
import { useSwipe } from "@vueuse/core";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTheme } from "vuetify";
import AppLayout from "./components/AppLayout.vue";
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

// Initialize theme and splashscreen on app mount
onMounted(async () => {
	// Ensure settings are loaded first
	if (settingsStore.settings.length === 0) {
		await settingsStore.fetchSettings();
	}
	// Initialize theme from settings
	await settingsStore.initTheme();
	vuetifyTheme.global.name.value = settingsStore.theme;

	// Close splashscreen after a short delay
	try {
		const main = await Window.getByLabel("main");
		const splash = await Window.getByLabel("splashscreen");

		// Small delay to ensure UI is rendered
		setTimeout(async () => {
			if (main) {
				await main.show();
				await main.setFocus();
			}
			if (splash) {
				await splash.close();
			}
		}, 1500);
	} catch (e) {
		console.error("Splashscreen error:", e);
	}
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

// Swipe Navigation
const tabs = ["/", "/timeline", "/tasks", "/stats"];
useSwipe(document.body, {
	onSwipeEnd(_e, direction) {
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
