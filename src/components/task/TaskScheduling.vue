<script setup lang="ts">
import { Clock } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { VDateInput } from "vuetify/labs/VDateInput";
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

const props = defineProps<{
	selTask: Task;
}>();

watch(
	() => props.selTask.recurrence?.type,
	async (newType) => {
		if (newType && newType !== RecurrenceType.NONE) {
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
			props.selTask.recurrence = customRecurrence;
		}
	}
);

watch(
	() => (props.selTask.recurrence as CustomRecurrence)?.customType,
	async (newType) => {
		if (newType === CustomRecurrenceType.MONTHLY) {
			(props.selTask.recurrence as CustomRecurrence).monthlyType =
				MonthlyRepeatType.ON_TASK_DATE;
		}
	}
);

/**
 * Checks if a given day ID is in the selectedDays array.
 * @param dayId - The unique identifier for the day.
 * @returns boolean
 */
const isSelected = (dayId: string): boolean => {
	if (!(props.selTask.recurrence as CustomRecurrence)) {
		return false;
	}
	const repeatOnDays = (props.selTask.recurrence as CustomRecurrence)
		.repeatOnDays;
	if (repeatOnDays) {
		const day = days.find((day) => day.id === dayId);
		return !!day && repeatOnDays.includes(day);
	}
	return false;
};

/**
 * Adds or removes a day from the selectedDays array.
 * @param dayId - The unique identifier for the day to toggle.
 */
const toggleDay = (dayId: string): void => {
	const repeatOnDays = (props.selTask.recurrence as CustomRecurrence)
		.repeatOnDays;
	if (repeatOnDays) {
		const day = days.find((day) => day.id === dayId);
		if (!day) return;
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
</script>

<template>
  <div class="space-y-3">
    <!-- Schedule For -->
    <div class="pt-4">
      <h2 class="text-lightText-primary dark:text-text-primary mb-2">Scheduling</h2>
    </div>
    
    <!-- Date -->
    <v-date-input
      v-model="selectedDate"
      color="primary"
      label="Date"
    />

    <!-- Time -->
    <v-text-field
      v-model="selectedTime"
      label="Time"
      readonly
    >
      <template v-slot:prepend-icon>
        <Clock :size="24" class="text-lightText-secondary dark:text-text-secondary" />
      </template>
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
