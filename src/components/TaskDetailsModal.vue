<script setup lang="ts">
import { ref, watch } from "vue";
import { VDateInput } from "vuetify/labs/VDateInput";
import { mdiClockOutline } from "@mdi/js";

const emit = defineEmits<{
	close: [];
}>();

interface Task {
	id: number;
	title: string;
	category: string;
	cycles: number;
	startTime: Date;
	gradient: string;
}

const ex_date: Date = new Date("2024/11/1, 18:00");
const exTask = ref<Task>({
	id: 0,
	title: "ExTitle",
	category: "work",
	cycles: 2,
	startTime: ex_date,
	gradient: "no-matter",
});

const categories = ["work", "school", "other"];
const showMenu = ref(false);
// Create reactive date and time properties
const selectedDate = ref<Date | null>(null);
const selectedTime = ref<string>("");

// Initialize date and time from existing startTime
const initializeDateAndTime = () => {
	const startTime = exTask.value.startTime;
	if (startTime) {
		const dateTime = new Date(startTime);
		selectedDate.value = dateTime;
		// Format time as HH:MM for v-time-picker
		selectedTime.value = dateTime.toTimeString().slice(0, 5);
	}
};

// Watch for changes in exTask.startTime to update our local values
watch(
	() => exTask.value.startTime,
	() => {
		initializeDateAndTime();
	},
	{ immediate: true },
);

// Watch for changes in date or time and update startTime
watch([selectedDate, selectedTime], ([newDate, newTime]) => {
	if (newDate && newTime) {
		// Combine date and time into ISO string
		const dateStr = newDate.toISOString().split("T")[0]; // YYYY-MM-DD
		const combinedDateTime = new Date(`${dateStr}T${newTime}:00`);

		exTask.value.startTime = new Date(combinedDateTime.toISOString());
	}
});

// Helper function to format date for display
const formatDisplayDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString();
};

// Helper function to format time for display
const formatDisplayTime = (dateString: string) => {
	return new Date(dateString).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
};
</script>

<template>
  <div class="fixed inset-0 bg-black bg-transparent flex items-center justify-center z-50 animate-fade-in ">
    <div class="w-[90%] h-[70%] flex items-start justify-between bg-gradient-to-br from-dark-bg to-dark-surface opacity-100 overflow-scroll pb-8">
      <div class="mx-6 mt-6 flex-col text-text-primary w-full">
      <div class="space-y-4">
        <h2
          class="mt-2 text-xl font-bold text-center w-full"
          > Edit task </h2>
        <h2>Details</h2>
        <!-- Task Name -->
        <div>
          <v-text-field
            label="Task name"
            :model-value="exTask.title"
          ></v-text-field>
        </div>

        <!-- Category -->
        <div>
          <v-select 
            label="Category"
            :model-value="exTask.category"
            :items="categories"
          >
          </v-select>
        </div>

        <h2>Duration</h2>
        <!-- Estimated Pomodoros -->
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
          :model-value="exTask.cycles"
          class="w-[50%]"
        ></v-number-input>

        <!-- Schedule For -->
        <div>
          <h2>Scheduling</h2>
        </div>
        <v-date-input
          v-model="selectedDate"
          label="Date"
          color="primary"
        />
        <v-text-field
          v-model="selectedTime"
          label="Time"
          :prepend-icon="mdiClockOutline"
          readonly
        >
        <v-menu
          :close-on-content-click="false"
          activator="parent"
          min-width="0"
        >
          <v-time-picker
            v-model="selectedTime"
            hide-header
          />
        </v-menu>
        </v-text-field>
      </div>


      <div class="flex gap-3 mt-8 ">
        <button 
          @click="emit('close')"
          class="flex-1 py-2 bg-dark-surface border border-dark-border rounded-lg text-text-secondary font-semibold hover:bg-dark-border transition-colors"
        >
          Close 
        </button>
        <button class="flex-1 py-2 bg-gradient-to-r from-pomodo-orange to-pomodo-red rounded-lg text-white font-semibold hover:opacity-90 transition-opacity">
          Save  
        </button>
      </div>
      </div>
    </div>
  </div> 
</template>
