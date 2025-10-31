<script setup lang="ts">
import { Pause, Play, RotateCcw, SkipForward } from "lucide-vue-next";
import { computed, ref } from "vue";
import { useCountdownTimer } from "../../components/timer/countdown";
import { Category } from "../../defines/category.ts";
import { Session } from "../../defines/session.ts";

const timer = useCountdownTimer(20, 10);
const completedSessions = ref<Array<Session>>([]);

const categories = ref<Array<Category>>([
	{
		id: 1,
		name: "work",
		color: "yellow"
	},
	{
		id: 2,
		name: "study",
		color: "green"
	},
	{
		id: 3,
		name: "cleaning",
		color: "purple"
	},
	{
		id: 4,
		name: "planning"
	}
]);

const selected_category = ref<Category>(categories.value[0]);
const nextTask = {
	name: "Algorithm study",
	estimate: 4
};
const themeColor = computed(() =>
	timer.mode.value === "focus" ? "pomodo-orange" : "green"
);
const showCategorySelector = computed(() => {
	if (timer.isRunning.value || timer.percent.value < 100) {
		return false;
	} else {
		return true;
	}
});

const allowSkip = computed(() => {
	if (timer.mode.value === "rest") {
		return true;
	}
	if (timer.isRunning.value) {
		return false;
	}
	if (timer.percent.value < 100) {
		return true;
	} else {
		return false;
	}
});

const toggleSession = () => {
	/* session not started */
	if (timer.percent.value === 100) {
		timer.setCategoryId(selected_category.value.id);
	} else if (timer.percent.value === 0) {
		timer.setCategoryId(undefined);
	}
	timer.toggleTimer();
};
</script>

<template>
  <div class="flex flex-col h-full bg-dark-bg">
    <!-- Main Timer Container -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 gap-10">
      <!-- Progress Ring -->
      <v-progress-circular :model-value="timer.percent.value" :color="themeColor" :size="170" width="10">
      </v-progress-circular>


      <!-- Focus / test -->
      <div :class="(`-mb-12 text-2xl text-${themeColor}`)">
        <div v-if="timer.mode.value === 'focus'">
          FOCUS
        </div>
        <div v-if="timer.mode.value === 'rest'">
          REST
        </div>
      </div>
      <!-- Timer Display -->
      <div :class="(`text-timer text-${themeColor} mt-12`)">
        {{ timer.formattedTime }}
      </div>

      <div class="w-64 h-22" v-if="timer.mode.value === 'focus'">
        <!-- Category Selector -->
        <v-select
          v-model="selected_category"
          :items="categories"
          item-title="name"
          label="Category"
          v-if="showCategorySelector"
          return-object
        >
        </v-select>
        <div v-else
          :class="(`text-3xl text-${selected_category.color} text-center -mt-10`)">
          {{ selected_category.name }}
        </div>
      </div>

      <!-- Control Buttons -->
      <div class="flex items-center gap-8 absolute bottom-40">
        <button 
          @click="timer.resetTimer"
          class="w-12 h-12 rounded-full bg-dark-surface border border-dark-border text-text-secondary flex items-center justify-center"
          :disabled="timer.isRunning.value || timer.percent.value === 100"
        >
          <RotateCcw :size="20" :class="{'opacity-50': timer.isRunning.value || timer.percent.value === 100}"/>
        </button>
        
        <button 
          @click="toggleSession"
          class="w-20 h-20 rounded-full text-white hover:scale-105 transition-transform shadow-fab hover:shadow-fab-hover flex items-center justify-center"
          :class="[
            {'bg-gradient-to-br from-pomodo-orange to-pomodo-red': !timer.isRunning.value && timer.mode.value === 'focus'},
            {'bg-gradient-to-br from-green-400 to-green-700': !timer.isRunning.value && timer.mode.value === 'rest'},
            {'bg-gradient-to-br from-gray-600 to-black': timer.isRunning.value}
          ]"
        >
            <Pause :size="32" v-if="timer.isRunning.value"/>
            <Play :size="32" v-else/>
        </button>
        
        <button 
          class="w-12 h-12 rounded-full bg-dark-surface border border-dark-border text-text-secondary flex items-center justify-center"
          :disabled="!allowSkip"
          :class="{'opacity-50': !allowSkip}"
          @click="timer.skip"
        >
          <SkipForward :size="20" />
        </button>
      </div>
    </div>

    <!-- Task Preview Bar (optional) -->
    <div class="px-6 py-4 bg-dark-pure border-t border-dark-border">
      <div class="text-text-muted text-sm text-center">
        Next: {{nextTask.name }} ( {{nextTask.estimate}} pomodoros )
      </div>
    </div>
  </div>
</template>
