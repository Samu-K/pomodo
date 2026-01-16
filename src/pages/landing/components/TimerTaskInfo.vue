<script setup lang="ts">
import type { Task } from "../../../defines/task";
import type { Category, Project } from "../../../funcs/commands";
import { TimerMode } from "../../../stores/timer";

defineProps<{
	selectedTask: Task | null;
	selectedProject: Project | null;
	selectedCategory: Category | null;
	showSelector: boolean;
	mode: TimerMode;
}>();

const emit = defineEmits<(e: "open-manager") => void>();
</script>

<template>
  <div class="w-72 h-22 mb-8 flex justify-center" v-if="mode === TimerMode.FOCUS">
    <template v-if="showSelector">
      <v-btn 
        data-testid="task-selector"
        @click="emit('open-manager')" 
        variant="outlined"
        :color="selectedCategory?.color || 'orange'"
        class="px-6 mx-auto block">
        <template v-if="selectedTask">
          <span class="font-semibold tracking-wider">{{ selectedTask.title }}</span>
        </template>
        <template v-else-if="selectedProject">
          <span class="font-semibold tracking-wider">{{ selectedProject.name }}</span>
        </template>
        <template v-else-if="selectedCategory">
          <span class="font-medium tracking-wide">{{ selectedCategory.name }}</span>
        </template>
        <template v-else>
          <span>Select Task</span>
        </template>
      </v-btn>
    </template>
    <template v-else>
      <span 
        class="-mt-5 text-sm font-medium tracking-wide uppercase"
        :style="{ color: selectedCategory?.color || 'var(--pomodo-orange)' }">
        <template v-if="selectedTask">
          {{ selectedTask.title }}
        </template>
        <template v-else-if="selectedProject">
          {{ selectedProject.name }}
        </template>
        <template v-else-if="selectedCategory">
          {{ selectedCategory.name }}
        </template>
      </span>
    </template>
  </div>
</template>
