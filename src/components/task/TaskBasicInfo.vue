<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useTaskCalculations } from "../../composables/useTaskCalculations";
import { Task } from "../../defines/task.ts";
import { useCategoryStore } from "../../stores/categories.ts";
import { useProjectStore } from "../../stores/project.ts";
import { useSettingsStore } from "../../stores/settings.ts";

const props = defineProps<{
	selTask: Task;
}>();

const projectStore = useProjectStore();
const categoryStore = useCategoryStore();
const settingsStore = useSettingsStore();

const { calculateTaskDuration, formatDuration } = useTaskCalculations();

const estimatedDurationString = computed(() => {
	const cycles = props.selTask.cycles || 1;
	const totalMinutes = calculateTaskDuration(cycles);
	return formatDuration(totalMinutes);
});

const updateCategoryFromProject = () => {
	const projectId = props.selTask.project_id;
	if (projectId) {
		const project = projectStore.projects.find((p) => p.id === projectId);
		if (project?.category_id) {
			props.selTask.category_id = project.category_id;
		}
	}
};

watch(() => props.selTask.project_id, updateCategoryFromProject, {
	immediate: true
});

watch(() => projectStore.projects, updateCategoryFromProject);

watch(
	() => props.selTask.category_id,
	(newVal) => {
		if (newVal) {
			if (props.selTask.project_id) {
				const project = projectStore.projects.find(
					(p) => p.id === props.selTask.project_id
				);
				if (project && project.category_id === newVal) {
					return;
				}
			}
			props.selTask.project_id = null;
		}
	}
);

onMounted(async () => {
	if (projectStore.projects.length === 0) {
		await projectStore.fetchProjects();
	}
	if (settingsStore.settings.length === 0) {
		await settingsStore.fetchSettings();
	}
	if (categoryStore.categories.length === 0) {
		await categoryStore.fetchCategories();
	}
});

// Check if project is pre-selected to determine initial mode
const isProjectSelection = ref(!!props.selTask.project_id);

const toggleSelectionMode = () => {
	isProjectSelection.value = !isProjectSelection.value;
	// Clear the other value when switching modes to ensure mutual exclusivity
	if (isProjectSelection.value) {
		props.selTask.category_id = null;
	} else {
		props.selTask.project_id = null;
	}
};
</script>

<template>
  <div class="space-y-3">
    <!-- Task Name -->
    <div>
      <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider mb-2">
        Task Name *
      </label>
      <v-text-field
        data-testid="task-name-input"
        placeholder="Enter task name" v-model="props.selTask.title" ></v-text-field> 
    </div> 
    
    <!-- Description -->
    <div>
      <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider mb-2">
        Description
      </label>
      <v-textarea
        data-testid="task-description-input"
        placeholder="Add some notes about this task..."
        v-model="props.selTask.description"
        rows="3"
        auto-grow
      ></v-textarea>
    </div>

    <!-- Project/Category Toggle -->
    <div>
      <div v-if="isProjectSelection">
        <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider mb-2">
          Project
        </label>
        <v-select
          data-testid="task-project-select"
          v-model="props.selTask.project_id"
          :items="projectStore.projects"
          item-title="name"
          item-value="id"
          clearable
        ></v-select>
        <p 
          @click="toggleSelectionMode"
          class="text-xs text-pomodo-orange cursor-pointer hover:underline"
        >
          add to category
        </p>
      </div>

      <div v-else>
        <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider mb-2">
          Category
        </label>
        <v-select 
          data-testid="task-category-select"
          v-model="props.selTask.category_id"
          :items="categoryStore.categories"
          item-title="name"
          item-value="id"
          clearable
        >
        </v-select>
        <p 
          @click="toggleSelectionMode"
          class="text-xs text-pomodo-orange cursor-pointer hover:underline"
        >
          add to project
        </p>
      </div>
    </div>

    <div>
      <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider">
        Estimated Pomodoros
      </label>
      <v-number-input
        :reverse="false"
        :min=1
        controlVariant="split"
        :hideInput="false"
        :inset="false"
        v-model="props.selTask.cycles"
        class="w-[50%] "
      ></v-number-input>
      <p class="text-xs text-light dark:text-text-secondary opacity-80 pl-1 -mt-4">
        ≈ {{ estimatedDurationString }}
      </p>
    </div>
  </div>
</template>
