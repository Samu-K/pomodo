<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { X } from "lucide-vue-next";
import { ref } from "vue";
import { RecurrenceType } from "../../defines/recur.ts";
import { Task } from "../../defines/task.ts";
import { createTaskWithRecurrence } from "../../funcs/task.ts";
import TaskEditBlock from "./TaskEditBlock.vue";

const emit = defineEmits<{
	close: [];
}>();

const curDate = ref<Date>(new Date());

const newTask = ref<Task>({
	id: 0,
	title: "",
	category: "",
	cycles: 0,
	startTime: curDate.value,
	recurrence: {
		type: RecurrenceType.NONE
	},
	gradient: "",
	completed: false
});

const saveTask = async () => {
	let ret = await createTaskWithRecurrence(newTask.value);
	await invoke("task_get_tasks")
		.then((tasks) => console.log(tasks))
		.catch((error) => console.error(error));
	await invoke("task_get_rules_for_task", { task_id: ret.task_id })
		.then((rules) => console.log(rules))
		.catch((error) => console.error(error));
	emit("close");
};
</script>

<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center  animate-fade-in overflow-auto">
    <div class="bg-light-bg dark:bg-dark-bg rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in max-h-[85%] border border-light-border dark:border-dark-border overflow-scroll">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-pomodo-orange">Create New Task</h2>
        <button 
          @click="emit('close')"
          class="w-8 h-8 flex items-center justify-center text-text-muted hover:text-white transition-colors"
        >
          <X :size="20" />
        </button>
      </div>

      <TaskEditBlock :selTask="newTask"/>

      <!-- Actions -->
      <div class="flex gap-3 mt-4">
        <button 
          @click="emit('close')"
          class="flex-1 py-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg text-lightText-secondary dark:text-text-secondary font-semibold hover:bg-light-border dark:hover:bg-dark-border transition-colors"
        >
          Cancel
        </button>
        <button class="flex-1 py-3 bg-gradient-to-r from-pomodo-orange to-pomodo-red rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
          @click="saveTask"
        >
          Create Task
        </button>
      </div>
    </div>
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
