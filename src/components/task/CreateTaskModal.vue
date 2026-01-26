<script setup lang="ts">
import { X } from "lucide-vue-next";
import { computed, ref } from "vue";
import {
	type OverlapInfo,
	useTaskOverlap
} from "../../composables/useTaskOverlap";
import { RecurrenceType } from "../../defines/recur.ts";
import { Task } from "../../defines/task.ts";
import { useTasks } from "../../stores/task";
import ConfirmationModal from "../ui/ConfirmationModal.vue";
import ScrollIndicator from "../ui/ScrollIndicator.vue";
import TaskEditBlock from "./TaskEditBlock.vue";

const props = defineProps<{
	initialDate?: Date;
	initialProjectId?: number;
	initialCycles?: number;
}>();

const emit = defineEmits<{
	close: [];
}>();

const curDate = ref<Date>(props.initialDate || new Date());
const tasksStore = useTasks();
const { checkForOverlap } = useTaskOverlap();

const isOpen = ref(true);
const scrollContainerRef = ref<HTMLElement | null>(null);
const showOverlapWarning = ref(false);
const overlapInfo = ref<OverlapInfo | null>(null);

const newTask = ref<Task>({
	id: 0,
	title: "",
	category: "",
	category_id: null,
	project_id: props.initialProjectId || null,
	cycles: props.initialCycles || 1,
	startTime: curDate.value,
	recurrence: {
		type: RecurrenceType.NONE
	},
	gradient: "",
	completed: false,
	completedCycles: 0
});

const close = () => {
	isOpen.value = false;
};

const overlapWarningMessage = computed(() => {
	if (!overlapInfo.value) return "";
	const task = overlapInfo.value.overlappingTask;
	const startTime = task.startTime.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit"
	});
	return `This task overlaps with "${task.title}" scheduled at ${startTime}. Do you want to create it anyway?`;
});

const saveTask = async () => {
	// Check for overlaps before saving
	const overlap = checkForOverlap(newTask.value, tasksStore.tasks);
	if (overlap) {
		overlapInfo.value = overlap;
		showOverlapWarning.value = true;
		return;
	}

	await tasksStore.addTask(newTask.value);
	close();
};

const confirmCreateWithOverlap = async () => {
	showOverlapWarning.value = false;
	overlapInfo.value = null;
	await tasksStore.addTask(newTask.value);
	close();
};

const cancelOverlapWarning = () => {
	showOverlapWarning.value = false;
	overlapInfo.value = null;
};

const onAfterLeave = () => {
	emit("close");
};
</script>

<template>
  <v-dialog 
    v-model="isOpen" 
    max-width="450" 
    @after-leave="onAfterLeave"
    class="backdrop-blur-sm"
  >
    <div 
      ref="scrollContainerRef"
      class="relative bg-light-bg dark:bg-dark-bg rounded-2xl p-6 w-full border border-light-border dark:border-dark-border overflow-y-auto shadow-xl mt-[max(1rem,env(safe-area-inset-top))] mb-[max(1rem,env(safe-area-inset-bottom))] max-h-[calc(100vh-max(2rem,env(safe-area-inset-top))-max(2rem,env(safe-area-inset-bottom)))] mx-auto"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-pomodo-orange">Create New Task</h2>
        <button 
          @click="close"
          class="w-8 h-8 flex items-center justify-center text-lightText-muted dark:text-text-muted hover:text-lightText-primary dark:hover:text-white transition-colors"
        >
          <X :size="20" />
        </button>
      </div>

      <TaskEditBlock :selTask="newTask"/>

      <!-- Actions -->
      <div class="flex gap-3 mt-4">
        <button 
          data-testid="cancel-task"
          @click="close"
          class="flex-1 py-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg text-lightText-secondary dark:text-text-secondary font-semibold hover:bg-light-border dark:hover:bg-dark-border transition-colors"
        >
          Cancel
        </button>
        <button 
          data-testid="confirm-create-task"
          class="flex-1 py-3 bg-gradient-to-r from-pomodo-orange to-pomodo-red rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
          @click="saveTask"
        >
          Create Task
        </button>
      </div>

      <ScrollIndicator :scrollContainer="scrollContainerRef" />
    </div>

    <ConfirmationModal 
      v-if="showOverlapWarning"
      title="Schedule Conflict"
      :message="overlapWarningMessage"
      primaryBtnText="Create Anyway"
      secondaryBtnText="Cancel"
      @primary="confirmCreateWithOverlap"
      @secondary="cancelOverlapWarning"
      @close="cancelOverlapWarning"
    />
  </v-dialog>
</template>

<style scoped>
</style>
