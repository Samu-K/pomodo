<script setup lang="ts">
import { Check, Minus, Plus, X } from "lucide-vue-next";
import { ref, computed } from "vue";
import { Task } from "../interfaces/task.ts";
import { VDateInput } from "vuetify/labs/VDateInput";
import { mdiClockOutline } from "@mdi/js";

const emit = defineEmits<{
	close: [];
}>();

const newTask = ref<Task>({
	id: 0,
	title: "",
	category: "",
	cycles: 0,
	startTime: new Date(),
	gradient: "",
	completed: false,
});

const recurranceOpts = [
	"No repeat",
	"Daily",
	"Weekly",
	"Monthly",
	"Yearly",
	"Weekdays",
	"Custom",
];
const customRecurranceOpts = ["day", "week", "month", "year"];
const selectedCustomRecurrance = ref(customRecurranceOpts[1]);
const customRecurranceRepeat = ref(1);

interface Day {
	id: string;
	label: string;
}

// Array of days to be rendered.
// Finnish days: M(aanantai), T(iistai), K(eskiviikko), T(orstai), P(erjantai), L(auantai), S(unnuntai)
const days: Day[] = [
	{ id: "monday", label: "M" },
	{ id: "tuesday", label: "T" },
	{ id: "wednesday", label: "K" },
	{ id: "thursday", label: "T" },
	{ id: "friday", label: "P" },
	{ id: "saturday", label: "L" },
	{ id: "sunday", label: "S" },
];

// Reactive array to store the IDs of selected days.
// Initialized with 'sat' (L) to match the screenshot.
const selectedDays = ref<string[]>([]);

/**
 * Checks if a given day ID is in the selectedDays array.
 * @param dayId - The unique identifier for the day.
 * @returns boolean
 */
const isSelected = (dayId: string): boolean => {
	return selectedDays.value.includes(dayId);
};

/**
 * Adds or removes a day from the selectedDays array.
 * @param dayId - The unique identifier for the day to toggle.
 */
const toggleDay = (dayId: string): void => {
	const index = selectedDays.value.indexOf(dayId);
	if (index === -1) {
		// If not selected, add it to the array
		selectedDays.value.push(dayId);
	} else {
		// If already selected, remove it
		selectedDays.value.splice(index, 1);
	}
};

const recurranceMode = ref(recurranceOpts[0]);
const categories = ["work", "study", "personal"];

const selectedDate = computed({
	get: () => {
		return newTask.value.startTime ? new Date(newTask.value.startTime) : null;
	},
	set: (value: Date | null) => {
		if (value && selectedTime.value) {
			const dateStr = value.toLocaleString().split(",")[0];
			const combinedDateTime = new Date(`${dateStr}, ${selectedTime.value}:00`);
			console.log(`Setting time ${combinedDateTime}`);
			newTask.value.startTime = combinedDateTime;
		}
	},
});

const selectedTime = computed({
	get: () => {
		return newTask.value.startTime
			? new Date(newTask.value.startTime).toTimeString().slice(0, 5)
			: "";
	},
	set: (value: string) => {
		if (value && selectedDate.value) {
			const dateStr = selectedDate.value.toLocaleString().split(",")[0];
			const combinedDateTime = new Date(`${dateStr}, ${value}:00`);
			console.log(`Setting time ${combinedDateTime}`);
			newTask.value.startTime = combinedDateTime;
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
            v-model="newTask.title"
          ></v-text-field>
        </div>

        <!-- Category -->
        <div>
          <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Category
          </label>
          <v-select 
            label="Category"
            v-model="newTask.category"
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
          v-model="newTask.cycles"
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
                v-model="customRecurranceRepeat"
              ></v-number-input>
              <v-select 
                v-model="selectedCustomRecurrance"
                :items="customRecurranceOpts"
              >
              </v-select>
            </div>
            <div
              v-if="selectedCustomRecurrance === 'week'"
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
              v-else-if="selectedCustomRecurrance === 'month'"
            >
              <h2> MONTH SELECTED </h2>  
            </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 mt-8">
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
