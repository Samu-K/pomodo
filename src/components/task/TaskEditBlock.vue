<script setup lang="ts">
import { mdiClockOutline } from "@mdi/js";
import { computed, onMounted, ref, watch } from "vue";
import { VDateInput } from "vuetify/labs/VDateInput";
import { useTaskCalculations } from "../../composables/useTaskCalculations";
import {
	CustomRecurrence,
	CustomRecurrenceType,
	days,
	MonthlyRepeatType,
	Recurrence,
	RecurrenceType,
	RepeatUntilType
} from "../../defines/recur.ts";
import { Task } from "../../defines/task.ts";
import { useCategoryStore } from "../../stores/categories.ts";
import { useProjectStore } from "../../stores/project.ts";
import { useSettingsStore } from "../../stores/settings.ts";

const projectStore = useProjectStore();
onMounted(() => {
	projectStore.fetchProjects();
});

const props = defineProps<{
	selTask: Task;
}>();

const settingsStore = useSettingsStore();

const { calculateTaskDuration, formatDuration } = useTaskCalculations();

const estimatedDurationString = computed(() => {
	const cycles = props.selTask.cycles || 1;
	const totalMinutes = calculateTaskDuration(cycles);
	return formatDuration(totalMinutes);
});

watch(
	() => props.selTask.recurrence?.type,
	async (newType) => {
		if (newType !== RecurrenceType.NONE) {
			props.selTask.recurrence = {
				type: newType,
				repeatUntilType: RepeatUntilType.REPEAT_FOREVER,
				repeatUntilTimes: 3
			} as Recurrence;
		}
		if (newType === RecurrenceType.CUSTOM) {
			const customRecurrence: Recurrence = {
				type: RecurrenceType.CUSTOM,
				customType: CustomRecurrenceType.WEEKLY,
				repeatOnDays: [days[props.selTask.startTime.getDay()]],
				repeatEveryX: 1,
				repeatUntilType: RepeatUntilType.REPEAT_FOREVER,
				repeatUntilTimes: 3
			};
			console.log("Setting custom recurrance");
			props.selTask.recurrence = customRecurrence;
		}
	}
);

watch(
	() => (props.selTask.recurrence as CustomRecurrence).customType,
	async (newType) => {
		if (newType === CustomRecurrenceType.MONTHLY) {
			(props.selTask.recurrence as CustomRecurrence).monthlyType =
				MonthlyRepeatType.ON_TASK_DATE;
		}
	}
);

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

const categoryStore = useCategoryStore();

// Fetch categories on mount if not already loaded
onMounted(async () => {
	if (settingsStore.settings.length === 0) {
		await settingsStore.fetchSettings();
	}
	if (categoryStore.categories.length === 0) {
		await categoryStore.fetchCategories();
	}
});

/**
 * Checks if a given day ID is in the selectedDays array.
 * @param dayId - The unique identifier for the day.
 * @returns boolean
 */
const isSelected = (dayId: string): boolean => {
	if (props.selTask.recurrence as CustomRecurrence) {
		return false;
	}
	let repeatOnDays = (props.selTask.recurrence as CustomRecurrence)
		.repeatOnDays;
	if (repeatOnDays) {
		const day = days.filter((day) => day.id === dayId)[0];
		return repeatOnDays.includes(day);
	}
	return false;
};

/**
 * Adds or removes a day from the selectedDays array.
 * @param dayId - The unique identifier for the day to toggle.
 */
const toggleDay = (dayId: string): void => {
	let repeatOnDays = (props.selTask.recurrence as CustomRecurrence)
		.repeatOnDays;
	if (repeatOnDays) {
		const day = days.filter((day) => day.id === dayId)[0];
		const index = repeatOnDays.indexOf(day);
		if (index === -1) {
			// If not selected, add it to the array
			repeatOnDays.push(day);
		} else {
			// If already selected, remove it
			repeatOnDays.splice(index, 1);
		}
		if (repeatOnDays.length === 0) {
			repeatOnDays.push(days[props.selTask.startTime.getDay()]);
		}
		(props.selTask.recurrence as CustomRecurrence).repeatOnDays = repeatOnDays;
	}
};

const selectedDate = computed({
	get: () => {
		return props.selTask.startTime ? new Date(props.selTask.startTime) : null;
	},
	set: (value: Date | null) => {
		if (value) {
			const current = props.selTask.startTime
				? new Date(props.selTask.startTime)
				: new Date();
			// Create new date preserving the time from current
			const newDateTime = new Date(value);
			newDateTime.setHours(
				current.getHours(),
				current.getMinutes(),
				current.getSeconds(),
				0
			);
			props.selTask.startTime = newDateTime;
		}
	}
});

const selectedTime = computed({
	get: () => {
		return props.selTask.startTime
			? new Date(props.selTask.startTime).toTimeString().slice(0, 5)
			: "";
	},
	set: (value: string) => {
		if (value && props.selTask.startTime) {
			const [hours, minutes] = value.split(":").map(Number);
			const newDateTime = new Date(props.selTask.startTime);
			newDateTime.setHours(hours, minutes, 0, 0);
			props.selTask.startTime = newDateTime;
		}
	}
});

const showTimeMenu = ref(false);
const onMinuteSelected = () => {
	setTimeout(() => {
		showTimeMenu.value = false;
	}, 100);
};

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
      <!-- Form -->
      <div class="space-y-3">
        <!-- Task Name -->
        <div>
          <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider mb-2">
            Task Name *
          </label>
          <v-text-field
            data-testid="task-name-input"
            placeholder="Enter task name" v-model="props.selTask.title" ></v-text-field> 
        </div> <!-- Description -->
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
        </div>
          <v-number-input
          :reverse="false"
          :min=1
          controlVariant="split"
          :hideInput="false"
          :inset="false"
          v-model="props.selTask.cycles"
          class="w-[50%] "
        ></v-number-input>
        <p class="text-xs text-light dark:text-text-secondary opacity-80 pl-1 -pt-12">
          ≈ {{ estimatedDurationString }}
        </p>

        <!-- Schedule For -->
        <div>
          <h2 class="text-lightText-primary dark:text-text-primary">Scheduling</h2>
        </div>
        <!-- Date -->
        <v-date-input
          v-model="selectedDate"
          color="primary"
        />

        <!-- Time -->
        <v-text-field
          v-model="selectedTime"
          label="Time"
          :prepend-icon="mdiClockOutline"
          readonly
        >
        <v-menu
          v-model="showTimeMenu"
          :close-on-content-click="false"
          activator="parent"
          min-width="0"
        >
          <v-time-picker
            v-model="selectedTime"
            format="24hr"
            hide-header
            @update:minute="onMinuteSelected"
          />
        </v-menu>
        </v-text-field>

        <!-- recurrence -->
        <div>
          <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider mb-2">
            Repeat 
          </label>
          <v-select 
            data-testid="task-recurrence-select"
            v-model="props.selTask.recurrence!.type"
            :items="Object.values(RecurrenceType)"
          >
          </v-select>
        </div>

        <div
          v-if="selTask.recurrence?.type === RecurrenceType.CUSTOM"
        >
            <div class="flex gap-1 items-center justify-start">
              <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider mb-2">
                Repeat every
              </label>
              <v-number-input
                :reverse="false"
                controlVariant="stacked"
                label=""
                :hideInput="false"
                :inset="false"
                v-model="(props.selTask.recurrence as CustomRecurrence).repeatEveryX"
                :min="1"
              ></v-number-input>
              <v-select 
                v-model="(props.selTask.recurrence as CustomRecurrence).customType"
                :items="Object.values(CustomRecurrenceType)"
              >
              </v-select>
            </div>
            <div
              v-if="(props.selTask.recurrence as CustomRecurrence).customType === 'week'"
            >
              <div class="rounded-lg">
                  
                  <h2 class="mb-4 text-lightText-primary dark:text-text-primary">
                    Repeat on 
                  </h2>
                  
                  <div class="flex items-start justify-start space-x-2">
                    <button
                      v-for="day in days"
                      :key="day.id"
                      @click="toggleDay(day.id)"
                      :class="[
                        'w-10 h-10 flex items-center justify-center rounded-full font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-bg dark:focus:ring-offset-gray-800 focus:ring-pomodo-orange',
                        isSelected(day.id) 
                          ? 'bg-pomodo-orange text-white' 
                          : 'bg-light-surface dark:bg-white/10 text-pomodo-orange dark:text-blue-300 hover:bg-light-border dark:hover:bg-white/20'
                      ]"
                    >
                      {{ day.label }}
                    </button>

                  </div>
                </div>
            </div>
      
            <div
              v-else-if="(props.selTask.recurrence as CustomRecurrence).customType === 'month'"
            >
              <v-select
                v-model="(props.selTask.recurrence as CustomRecurrence).monthlyType"
                :items="Object.values(MonthlyRepeatType).filter(value => typeof value === 'string')"
              >
              </v-select>
            </div>

        </div>
        <div v-if="selTask.recurrence?.type !== RecurrenceType.NONE">
          <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider mb-2 pt-8">
            Repeat until 
          </label>
          <v-radio-group v-model="(props.selTask.recurrence as CustomRecurrence).repeatUntilType" >
            <v-radio label="Repeat forever" value="one"></v-radio>
            <div class="flex items-center justify-center gap-1">
              <v-radio label="Until" value="two"></v-radio>
              <v-date-input
                v-model="(props.selTask.recurrence as CustomRecurrence).repeatUntilDate" 
                :disabled="(props.selTask.recurrence as CustomRecurrence).repeatUntilType!== 'two'"
              ></v-date-input>
            </div>
            <div class="flex items-center justify-center gap-1">
              <v-radio label="Once repeated" value="three"></v-radio>
              <v-number-input
                :reverse="false"
                controlVariant="stacked"
                label=""
                :hideInput="false"
                :inset="false"
                v-model="(props.selTask.recurrence as CustomRecurrence).repeatUntilTimes"
                width="4"
                :min="1"
                :disabled="(props.selTask.recurrence as CustomRecurrence).repeatUntilType !== 'three'"
              ></v-number-input>
            </div>
          </v-radio-group>
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
