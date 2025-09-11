<script setup lang="ts">
import { Task } from "../interfaces/task.ts";
import TaskEditBlock from "./TaskEditBlock.vue";
import { watch, ref } from "vue";
import { updateTask } from "../defines/task_funcs.ts";

const emit = defineEmits<{
	close: [];
}>();

const props = defineProps<{
	selTask: Task;
}>();

const saveAndExit = () => {
	updateTask(props.selTask, recurrenceChanged.value);
	emit("close");
};

const exitWithoutSave = () => {
	emit("close");
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
    <div class="bg-dark-bg rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in max-h-[85%] border border-dark-border overflow-scroll"
      @click.stop
    >
    
      <TaskEditBlock :selTask="props.selTask" />

      <div class="flex gap-3 mt-8 ">
        <button 
          @click="exitWithoutSave"
          class="flex-1 py-2 bg-dark-surface border border-dark-border rounded-lg text-text-secondary font-semibold hover:bg-dark-border transition-colors"
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
