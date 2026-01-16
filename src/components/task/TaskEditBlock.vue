<script setup lang="ts">
import { Task } from "../../defines/task.ts";
import TaskBasicInfo from "./TaskBasicInfo.vue";
import TaskScheduling from "./TaskScheduling.vue";

const props = defineProps<{
	selTask: Task;
}>();
</script>

<template>
  <div class="space-y-4">
    <TaskBasicInfo :sel-task="props.selTask" />
    <v-divider class="my-6 opacity-20"></v-divider>
    <TaskScheduling :sel-task="props.selTask" />
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from { 
    opacity: 0;
    transform: scale(0.9);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}
</style>
