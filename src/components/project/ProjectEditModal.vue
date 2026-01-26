<script setup lang="ts">
import { X } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import { useTaskCalculations } from "../../composables/useTaskCalculations";
import type { Project } from "../../funcs/commands";
import { useCategoryStore } from "../../stores/categories";
import ScrollIndicator from "../ui/ScrollIndicator.vue";

const props = defineProps<{
	project: Project;
}>();

const emit = defineEmits<{
	close: [];
	save: [project: Project];
}>();

const categoryStore = useCategoryStore();
const { focusDuration } = useTaskCalculations();

const isOpen = ref(true);
const scrollContainerRef = ref<HTMLElement | null>(null);
const localProject = ref<Project>({ ...props.project });

onMounted(async () => {
	if (categoryStore.categories.length === 0) {
		await categoryStore.fetchCategories();
	}
});

const close = () => {
	isOpen.value = false;
};

const save = () => {
	emit("save", localProject.value);
	close();
};

const formatEstimatedTime = (cycles: number | null | undefined) => {
	if (!cycles) return "0m";
	const totalMinutes = cycles * focusDuration.value;
	const h = Math.floor(totalMinutes / 60);
	const m = totalMinutes % 60;

	if (h > 0 && m > 0) return `${h}h ${m}m`;
	if (h > 0) return `${h}h`;
	return `${m}m`;
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
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-pomodo-orange">
            {{ localProject.id === 0 ? 'Create New Project' : 'Edit Project' }}
        </h2>
        <button 
          @click="close"
          class="w-8 h-8 flex items-center justify-center text-lightText-muted dark:text-text-muted hover:text-lightText-primary dark:hover:text-white transition-colors"
        >
          <X :size="20" />
        </button>
      </div>

      <div class="space-y-4">
        <!-- Project Name -->
        <div>
          <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider mb-2">
            Project Name *
          </label>
          <v-text-field
            v-model="localProject.name"
            placeholder="Enter project name"
            hide-details
            variant="outlined"
            density="comfortable"
          ></v-text-field>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider mb-2">
            Description
          </label>
          <v-textarea
            v-model="localProject.description"
            placeholder="Brief description of the project"
            rows="2"
            auto-grow
            hide-details
            variant="outlined"
            density="comfortable"
          ></v-textarea>
        </div>

        <div class="grid grid-cols-2 gap-x-4 gap-y-1">
          <!-- Labels -->
          <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider">
            Est. Pomodoros
          </label>
          <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider">
            Category
          </label>

          <!-- Info Row -->
          <div class="h-5 flex items-center">
            <span v-if="localProject.estimated_pomodoros" class="text-[10px] text-text-muted">
              ≈ {{ formatEstimatedTime(localProject.estimated_pomodoros) }}
            </span>
          </div>
          <div class="h-5"></div>

          <!-- Inputs -->
          <v-number-input
            v-model="localProject.estimated_pomodoros"
            :min="1"
            controlVariant="split"
            hide-details
            variant="outlined"
            density="comfortable"
            data-testid="estimated-pomodoros-input"
          ></v-number-input>
          <v-select
            v-model="localProject.category_id"
            :items="categoryStore.categories"
            item-title="name"
            item-value="id"
            hide-details
            variant="outlined"
            density="comfortable"
          ></v-select>
        </div>
      </div>

      <div class="flex gap-3 mt-8">
        <button 
          @click="close"
          class="flex-1 py-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg text-lightText-secondary dark:text-text-secondary font-semibold hover:bg-light-border dark:hover:bg-dark-border transition-colors"
        >
          Cancel
        </button>
        <button 
          data-testid="save-project-btn"
          class="flex-1 py-3 bg-gradient-to-r from-pomodo-orange to-pomodo-red rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          @click="save"
          :disabled="!localProject.name"
        >
          {{ localProject.id === 0 ? 'Create Project' : 'Save Changes' }}
        </button>
      </div>

      <ScrollIndicator :scrollContainer="scrollContainerRef" />
    </div>
  </v-dialog>
</template>
