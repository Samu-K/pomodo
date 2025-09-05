<script setup lang="ts">
import { ref, computed } from "vue";
import { VDateInput } from "vuetify/labs/VDateInput";
import { mdiClockOutline } from "@mdi/js";
import { Task } from "../interfaces/task.ts";

const emit = defineEmits<{
	close: [];
	"update:modelValue": [value: boolean];
}>();

const props = defineProps<{
	selTask: Task;
}>();

const categories = ["work", "school", "other"];
// Create reactive date and time properties
// Computed properties for two-way binding
const selectedDate = computed({
	get: () => {
		return props.selTask.startTime ? new Date(props.selTask.startTime) : null;
	},
	set: (value: Date | null) => {
		if (value && selectedTime.value) {
			const dateStr = value.toLocaleString().split(",")[0];
			const combinedDateTime = new Date(`${dateStr}, ${selectedTime.value}:00`);
			console.log(`Setting time ${combinedDateTime}`);
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
			console.log(`Setting time ${combinedDateTime}`);
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

const saveAndExit = () => {
	emit("close");
};

const exitWithoutSave = () => {
	emit("close");
};
</script>

<template>
  <button class="fixed inset-0 bg-black bg-transparent flex items-center justify-center z-50 animate-fade-in cursor-default"
   @click="emit('close')" 
  >
    <div class="w-[90%] h-[70%] flex items-start justify-between bg-gradient-to-br from-dark-bg to-dark-surface opacity-100 overflow-scroll pb-8"
      @click.stop
    >
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
            v-model="props.selTask.title"
          ></v-text-field>
        </div>

        <!-- Category -->
        <div>
          <v-select 
            label="Category"
            v-model="props.selTask.category"
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
      </div>


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
  </button> 
</template>
