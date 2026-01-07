<script setup lang="ts">
import { ref, watch } from "vue";
import { Task } from "../../defines/task.ts";
import { useTasks } from "../../stores/task";
import ConfirmationModal from "../ui/ConfirmationModal.vue";
import TaskEditBlock from "./TaskEditBlock.vue";

const emit = defineEmits<{
	close: [];
}>();

const props = defineProps<{
	selTask: Task;
}>();

const taskStore = useTasks();

const isOpen = ref(true);

const close = () => {
	isOpen.value = false;
};

const saveAndExit = async () => {
	await taskStore.updateTask(props.selTask, recurrenceChanged.value);
	close();
};

const exitWithoutSave = () => {
	close();
};

const showDeleteConfirmation = ref(false);

const deleteTask = () => {
	showDeleteConfirmation.value = true;
};

const confirmDelete = async () => {
	await taskStore.deleteTask(props.selTask.id);
	showDeleteConfirmation.value = false;
	close();
};

const onAfterLeave = () => {
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
  <v-dialog 
    v-model="isOpen" 
    max-width="450" 
    @after-leave="onAfterLeave"
    class="backdrop-blur-sm"
  >
    <div class="bg-light-bg dark:bg-dark-bg rounded-2xl w-full border border-light-border dark:border-dark-border shadow-xl mt-[max(1rem,env(safe-area-inset-top))] mb-[max(1rem,env(safe-area-inset-bottom))] max-h-[calc(100vh-max(2rem,env(safe-area-inset-top))-max(2rem,env(safe-area-inset-bottom)))] mx-auto flex flex-col">
      <!-- Scrollable content area -->
      <div class="flex-1 overflow-y-auto p-6 pb-0">
        <TaskEditBlock :selTask="props.selTask" />
      </div>

      <!-- Fixed button footer -->
      <div class="flex gap-3 p-6 pt-4 border-t border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg rounded-b-2xl">
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

    <ConfirmationModal 
      v-if="showDeleteConfirmation"
      title="Delete Task"
      message="Are you sure you want to delete this task? This action cannot be undone."
      primaryBtnText="Delete"
      secondaryBtnText="Cancel"
      :isDanger="true"
      @primary="confirmDelete"
      @secondary="showDeleteConfirmation = false"
      @close="showDeleteConfirmation = false"
    />
  </v-dialog> 
</template>
