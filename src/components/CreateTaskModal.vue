<script setup lang="ts">
import { X } from "lucide-vue-next";
import { ref } from "vue";
import { days, monthlyCustomTypes } from "../defines/task_defines.ts";
import { Task } from "../interfaces/task.ts";
import TaskEditBlock from "./TaskEditBlock.vue";

const emit = defineEmits<{
	close: [];
}>();

const curDate = ref<Date>(new Date());

const newCustomRecurrance = {
	repeat_every_x: 1,
	repeat_type: "week",

	repeat_on_days: [days[curDate.value.getDay()].id],
	repeat_monthly_type: monthlyCustomTypes[0],

	repeat_until_type: "one",
	repeat_until_date: undefined,
	repeat_until_times: 1,
};

const newTask = ref<Task>({
	id: 0,
	title: "",
	category: "",
	cycles: 0,
	startTime: curDate.value,
	recurrance: newCustomRecurrance,
	gradient: "",
	completed: false,
});
</script>

<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center  animate-fade-in overflow-auto">
    <div class="bg-dark-bg rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in max-h-[85%] border border-dark-border overflow-scroll">
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
          class="flex-1 py-3 bg-dark-surface border border-dark-border rounded-lg text-text-secondary font-semibold hover:bg-dark-border transition-colors"
        >
          Cancel
        </button>
        <button class="flex-1 py-3 bg-gradient-to-r from-pomodo-orange to-pomodo-red rounded-lg text-white font-semibold hover:opacity-90 transition-opacity">
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
