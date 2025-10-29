<script setup lang="ts">
import { ref } from "vue";
import AppLayout from "./components/AppLayout.vue";
import CreateCategoryModal from "./components/task/CreateCategoryModal.vue";
import CreateTaskModal from "./components/task/CreateTaskModal.vue";
import TaskDetailsModal from "./components/task/TaskDetailsModal.vue";
import { RecurrenceType } from "./defines/recur.ts";
import { Task } from "./defines/task.ts";
import TimerScreen from "./pages/landing/TimerScreen.vue";
import SettingsScreen from "./pages/settings/SettingsScreen.vue";
import StatsScreen from "./pages/stats/StatsScreen.vue";
import TimelineScreen from "./pages/timeline/TimelineScreen.vue";

// Navigation state
const activeTab = ref<"timer" | "timeline" | "tasks" | "stats">("timer");
const showSettings = ref(false);

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

// Handle navigation
const handleNavClick = (tab: typeof activeTab.value) => {
	activeTab.value = tab;
	showSettings.value = false;
};

const handleSettingsClick = () => {
	showSettings.value = true;
};

const handleBackClick = () => {
	showSettings.value = false;
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
    :header-title="showSettings ? 'Settings' : 'Pomodo'"
    :show-back-button="showSettings"
    :show-settings-button="!showSettings"
    :active-tab="activeTab"
    @nav-click="handleNavClick"
    @back-click="handleBackClick"
  >
    <!-- Dynamic Screen Rendering -->
    <SettingsScreen v-if="showSettings" />
    <TimerScreen v-else-if="activeTab === 'timer'" />
    <TimelineScreen v-else-if="activeTab === 'timeline'" @add-task="handleAddTask" @task-details="openTaskDetails"/>
    <StatsScreen v-else-if="activeTab === 'stats'"
    @settings-click="handleSettingsClick"
    />
    <div v-else class="p-6 text-white">
      Tasks Screen (To be implemented)
    </div>
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
