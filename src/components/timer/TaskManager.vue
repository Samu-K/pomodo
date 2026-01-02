<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import type { Task } from "../../defines/task";
import { useTasks } from "../../stores/task";
import { useProjectStore } from "../../stores/project";

defineProps<{
	selectedTaskId: number | null;
	modelValue?: boolean;
}>();

const emit = defineEmits<{
	(e: "close"): void;
	(e: "select", task: Task): void;
	(e: "selectProject", projectId: number): void;
	(e: "clear"): void;
	(e: "selectCategory"): void;
	(e: "update:modelValue", value: boolean): void;
}>();

const tasksStore = useTasks();
const projectStore = useProjectStore();
const activeTab = ref(0);

onMounted(() => {
	projectStore.fetchProjects();
});

const dialogOpen = ref(true);

watch(dialogOpen, (val) => {
	if (!val) {
		emit("close");
	}
});

// Filter tasks for "Today's Focus" (expanded tasks in store)
const filteredTasks = computed(() => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	return tasksStore.expandedTasks.filter((t) => {
		return !t.completed && t.startTime >= today && t.startTime < tomorrow;
	});
});

const selectTask = (task: Task) => {
	emit("select", task);
	dialogOpen.value = false;
};

const clearTask = () => {
	emit("clear");
	emit("selectCategory");
	dialogOpen.value = false;
};

const selectProject = (id: number) => {
	emit("selectProject", id);
	dialogOpen.value = false;
};
</script>

<template>
  <v-dialog v-model="dialogOpen" max-width="400" class="mx-4">
    <v-card class="rounded-2xl">
      <v-tabs v-model="activeTab" grow color="orange">
        <v-tab :value="0">Tasks</v-tab>
        <v-tab :value="1">Projects</v-tab>
      </v-tabs>
      
      <v-card-text class="px-6 overflow-y-auto" style="max-height: 50vh">
        <v-window v-model="activeTab">
          <v-window-item :value="0">
            <div v-if="filteredTasks.length === 0" class="text-center text-text-muted py-8">
              No tasks scheduled for today.
            </div>
            
            <div v-else class="flex flex-col py-2">
              <v-btn
                v-for="task in filteredTasks"
                :key="task.id + '_' + (task.startTime?.toISOString() || task.id)"
                @click="selectTask(task)"
                variant="tonal"
                class="mt-3 task-btn"
                data-testid="task-item"
                :color="selectedTaskId === task.id ? 'orange' : undefined"
              >
                <div class="flex flex-col items-center w-full py-2">
                  <span class="font-medium text-center break-words w-full px-2" style="line-height: 1.3">{{ task.title }}</span>
                  <span class="text-xs opacity-70 mt-1" v-if="task.category">{{ task.category }}</span>
                </div>
              </v-btn>
            </div>
          </v-window-item>

          <v-window-item :value="1">
            <div v-if="projectStore.projects.length === 0" class="text-center text-text-muted py-8">
              No projects found.
            </div>
            <div v-else class="flex flex-col py-2">
              <v-btn
                v-for="project in projectStore.projects"
                :key="project.id"
                @click="selectProject(project.id)"
                variant="tonal"
                class="mt-3 task-btn"
                data-testid="project-item"
                :color="selectedTaskId === null && project.id === 1 ? 'orange' : undefined" 
              >
                <div class="flex flex-col items-center w-full py-2">
                  <span class="font-medium text-center break-words w-full px-2" style="line-height: 1.3">{{ project.name }}</span>
                </div>
              </v-btn>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
      
      <v-divider />
      
      <v-card-actions class="pa-4">
        <v-btn 
          block 
          variant="text" 
          color="grey"
          @click="clearTask"
        >
          No task
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.task-btn {
  height: auto !important;
  min-height: 48px;
}

.task-btn :deep(.v-btn__content) {
  white-space: normal;
  flex-wrap: wrap;
  width: 100%;
}
</style>
