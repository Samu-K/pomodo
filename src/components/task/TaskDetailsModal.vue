<script setup lang="ts">
import { ref, watch } from "vue";
import { Task } from "../../defines/task.ts";
import { useTasks } from "../../stores/task";
import TaskEditBlock from "./TaskEditBlock.vue";

const emit = defineEmits<{
	close: [];
}>();

const props = defineProps<{
	selTask: Task;
}>();

const taskStore = useTasks();

const saveAndExit = async () => {
	await taskStore.updateTask(props.selTask, recurrenceChanged.value);
	emit("close");
};

const exitWithoutSave = () => {
	emit("close");
};

const deleteTask = async () => {
	if (confirm("Are you sure you want to delete this task?")) {
		await taskStore.deleteTask(props.selTask.id);
		emit("close");
	}
};

const recurrenceChanged = ref(false);
watch(
	() => props.selTask.recurrence,
	(_oldValue, _newValue) => {
		recurrenceChanged.value = true;
	}
);
</script>

<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center  animate-fade-in overflow-auto"
    @click="emit('close')" 
  >
    <div class="bg-light-bg dark:bg-dark-bg rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in max-h-[85%] border border-light-border dark:border-dark-border overflow-scroll"
      @click.stop
    >
    
      <TaskEditBlock :selTask="props.selTask" />

      <div class="flex gap-3 mt-8">
        <button 
          @click="deleteTask"
          class="px-4 py-2 bg-light-surface dark:bg-dark-surface border border-red-500/30 text-red-500 rounded-lg font-semibold hover:bg-red-500/10 transition-colors"
        >
          Delete
        </button>
        <button 
          @click="exitWithoutSave"
          class="flex-1 py-2 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg text-lightText-secondary dark:text-text-secondary font-semibold hover:bg-light-border dark:hover:bg-dark-border transition-colors"
        >
          Close 
        </button>
        <button 
            class="flex-1 py-2 bg-gradient-to-r from-pomodo-orange to-pomodo-red rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
            @click="saveAndExit"
        >
          Save  
        </button>
      </div>
    </div>
  </div> 
</template>
