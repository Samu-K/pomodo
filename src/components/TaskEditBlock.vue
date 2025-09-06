<script setup lang="ts">
import { mdiClockOutline } from "@mdi/js";
import { computed, ref } from "vue";
import { VDateInput } from "vuetify/labs/VDateInput";
import {
	customRecurranceOpts,
	days,
	monthlyCustomTypes,
	recurranceOpts,
} from "../defines/task_defines.ts";
import { Task } from "../interfaces/task.ts";

const props = defineProps<{
	selTask: Task;
}>();

const categories = ["work", "study", "personal"];

const recurranceMode = ref(recurranceOpts[0]);

/**
 * Checks if a given day ID is in the selectedDays array.
 * @param dayId - The unique identifier for the day.
 * @returns boolean
 */
const isSelected = (dayId: string): boolean => {
	return props.selTask.recurrance.repeat_on_days.includes(dayId);
};

/**
 * Adds or removes a day from the selectedDays array.
 * @param dayId - The unique identifier for the day to toggle.
 */
const toggleDay = (dayId: string): void => {
	const index = props.selTask.recurrance.repeat_on_days.indexOf(dayId);
	if (index === -1) {
		// If not selected, add it to the array
		props.selTask.recurrance.repeat_on_days.push(dayId);
	} else {
		// If already selected, remove it
		props.selTask.recurrance.repeat_on_days.splice(index, 1);
	}
	if (props.selTask.recurrance.repeat_on_days.length === 0) {
		props.selTask.recurrance.repeat_on_days.push(
			days[props.selTask.startTime.getDay()].id,
		);
	}
};

const selectedDate = computed({
	get: () => {
		return props.selTask.startTime ? new Date(props.selTask.startTime) : null;
	},
	set: (value: Date | null) => {
		if (value && selectedTime.value) {
			const dateStr = value.toLocaleString().split(",")[0];
			const combinedDateTime = new Date(`${dateStr}, ${selectedTime.value}:00`);
			props.selTask.startTime = combinedDateTime;
		}
	},
});

const selectedTime = computed({
	get: () => {
		return props.selTask.startTime
			? new Date(props.selTask.startTime).toTimeString().slice(0, 5)
			: "";
	},
	set: (value: string) => {
		if (value && selectedDate.value) {
			const dateStr = selectedDate.value.toLocaleString().split(",")[0];
			const combinedDateTime = new Date(`${dateStr}, ${value}:00`);
			props.selTask.startTime = combinedDateTime;
		}
	},
});

const showTimeMenu = ref(false);
const onMinuteSelected = () => {
	setTimeout(() => {
		showTimeMenu.value = false;
	}, 100);
};
</script>

<template>
      <!-- Form -->
      <div class="space-y-3">
        <!-- Task Name -->
        <div>
          <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Task Name *
          </label>
          <v-text-field
            label="Task name"
            placeholder="Enter task name"
            v-model="props.selTask.title"
          ></v-text-field>
        </div>

        <!-- Category -->
        <div>
          <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Category
          </label>
          <v-select 
            label="Category"
            v-model="props.selTask.category"
            :items="categories"
          >
          </v-select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Estimated Pomodoros
          </label>
        </div>
          <v-number-input
          :reverse="false"
          :min=0
          controlVariant="split"
          :hideInput="false"
          :inset="false"
          v-model="props.selTask.cycles"
          class="w-[50%]"
        ></v-number-input>

        <!-- Schedule For -->
        <div>
          <h2>Scheduling</h2>
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

        <!-- Recurrance -->
        <div>
          <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Repeat 
          </label>
          <v-select 
            v-model="recurranceMode"
            :items="recurranceOpts"
          >
          </v-select>
        </div>

        <div
          v-if="recurranceMode.toLowerCase() === 'custom'"
        >
            <div class="flex gap-1 items-center justify-start">
              <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Repeat every
              </label>
              <v-number-input
                :reverse="false"
                controlVariant="stacked"
                label=""
                :hideInput="false"
                :inset="false"
                v-model="props.selTask.recurrance.repeat_every_x"
                :min="1"
              ></v-number-input>
              <v-select 
                v-model="props.selTask.recurrance.repeat_type"
                :items="customRecurranceOpts"
              >
              </v-select>
            </div>
            <div
              v-if="props.selTask.recurrance.repeat_type === 'week'"
            >
              <div class="rounded-lg">
                  
                  <h2 class="mb-4">
                    Repeat on 
                  </h2>
                  
                  <div class="flex items-start justify-start space-x-2">
                    <button
                      v-for="day in days"
                      :key="day.id"
                      @click="toggleDay(day.id)"
                      :class="[
                        'w-10 h-10 flex items-center justify-center rounded-full font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-400',
                        isSelected(day.id) 
                          ? 'bg-blue-300 text-gray-900' 
                          : 'bg-white/10 text-blue-300 hover:bg-white/20'
                      ]"
                    >
                      {{ day.label }}
                    </button>

                  </div>
                </div>
            </div>
      
            <div
              v-else-if="props.selTask.recurrance.repeat_type === 'month'"
            >
              <v-select
                v-model="props.selTask.recurrance.repeat_monthly_type"
                :items="monthlyCustomTypes"
              >
              </v-select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 pt-8">
                Repeat until 
              </label>
              <v-radio-group v-model="props.selTask.recurrance.repeat_until_type">
                <v-radio label="Repeat forever" value="one"></v-radio>
                <div class="flex items-center justify-center gap-1">
                  <v-radio label="Until" value="two"></v-radio>
                  <v-date-input
                    v-model="props.selTask.recurrance.repeat_until_date" 
                    :disabled="props.selTask.recurrance.repeat_until_type !== 'two'"
                  </v-date-input>
                </div>
                <div class="flex items-center justify-center gap-1">
                  <v-radio label="Once repeated" value="three"></v-radio>
                  <v-number-input
                    :reverse="false"
                    controlVariant="stacked"
                    label=""
                    :hideInput="false"
                    :inset="false"
                    v-model="props.selTask.recurrance.repeat_until_times"
                    width="4"
                    :min="1"
                    :disabled="props.selTask.recurrance.repeat_until_type !== 'three'"
                  ></v-number-input>
                </div>
              </v-radio-group>
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
