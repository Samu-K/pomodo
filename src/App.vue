<script setup lang="ts">
import {
	isPermissionGranted,
	requestPermission
} from "@tauri-apps/plugin-notification";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
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
import { registerShortcuts } from "./funcs/shortcuts";
import { useSettingsStore } from "./stores/settings";
import { TimerMode, useTimerStore } from "./stores/timer";
import { useUIStore } from "./stores/ui";

const route = useRoute();
const settingsStore = useSettingsStore();
const uiStore = useUIStore();
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
	isLoading.value = false;
});

const toggleTimerSetting = computed(
	() => settingsStore.settings.find((s) => s.key === "Toggle Timer")?.value
);
watch(toggleTimerSetting, async (nv, ov) => {
	if (nv && nv !== ov) await registerShortcuts();
});

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
  <WelcomeDialog v-if="showWelcomeDialog" @close="showWelcomeDialog = false; localStorage.setItem('pomodo-welcome-seen', 'true')"
    @create-categories="showWelcomeDialog = false; localStorage.setItem('pomodo-welcome-seen', 'true'); showCreateCategory = true"
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
</template>
