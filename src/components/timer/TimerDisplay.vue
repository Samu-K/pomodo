<script setup lang="ts">
import { computed } from "vue";
import { TimerMode, useTimerStore } from "../../stores/timer";
import { useTimerSettings } from "../../stores/timer/useTimerSettings";

const timer = useTimerStore();
const { longBreakInterval } = useTimerSettings();

const themeColor = computed(() =>
	timer.mode === TimerMode.FOCUS ? "pomodo-orange" : "green"
);

const isFocusRunning = computed(
	() => timer.isRunning && timer.mode === TimerMode.FOCUS
);
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-10">
    <div v-if="!isFocusRunning" class="flex gap-3 mb-2">
      <div
        v-for="i in longBreakInterval"
        :key="i"
        class="w-3 h-3 rounded-full border border-pomodo-orange transition-all duration-300"
        :class="{
          'bg-pomodo-orange': i <= timer.sessionStreak,
          'bg-transparent': i > timer.sessionStreak,
        }"
      ></div>
    </div>
    <v-progress-circular
      :model-value="timer.percent"
      :color="themeColor"
      :size="170"
      width="10"
      z-index="2"
    ></v-progress-circular>

    <div :class="`-mb-12 text-2xl text-${themeColor}`">
      {{ timer.mode === TimerMode.FOCUS ? "FOCUS" : "REST" }}
    </div>

    <div :class="`text-timer text-${themeColor} mt-12`">
      {{ timer.formattedTime }}
    </div>
  </div>
</template>

<style scoped>
.text-timer {
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
  font-size: 6rem;
  font-weight: 700;
  line-height: 1;
}
</style>
