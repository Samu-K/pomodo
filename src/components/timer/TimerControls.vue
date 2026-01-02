<script setup lang="ts">
import { Pause, Play, RotateCcw, SkipForward } from "lucide-vue-next";
import { computed } from "vue";
import type { Category } from "../../funcs/commands";
import { useSettingsStore } from "../../stores/settings";
import { TimerMode, useTimerStore } from "../../stores/timer";

const props = defineProps<{
	selectedCategory: Category | null;
	canStart: boolean;
}>();

const timer = useTimerStore();
const settingsStore = useSettingsStore();

const isDark = computed(() => settingsStore.resolvedTheme === "dark");

const allowSkip = computed(() => {
	if (timer.mode === TimerMode.REST) return true;
	// Focus mode: only if paused (and maybe canStart? No, skipping implies abandoning session or moving to break, usually allowed)
	return !timer.isRunning;
});

const allowReset = computed(() => {
	if (timer.mode === TimerMode.REST) return false;
	// Focus mode: only if paused
	return !timer.isRunning && timer.percent < 100;
});
const handleToggle = () => {
	console.log("TimerControls: toggle clicked", {
		canStart: props.canStart,
		isRunning: timer.isRunning
	});
	timer.toggleTimer();
};
</script>

<template>
  <div class="flex items-center justify-center gap-8 w-full pb-8 z-10">
    <button
      data-testid="reset-timer"
      @click="timer.resetTimer"
      class="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
      :class="[
        isDark
          ? 'bg-dark-surface border border-dark-border text-text-secondary'
          : 'bg-transparent border-[3px] border-black text-black',
      ]"
      :disabled="!allowReset"
    >
      <RotateCcw :size="20" :class="{ 'opacity-50': !allowReset }" />
    </button>

    <button
      data-testid="toggle-timer"
      @click="timer.toggleTimer"
      :disabled="!canStart"
      class="w-20 h-20 rounded-full text-white flex items-center justify-center transition-transform"
      :class="[
        {
          'bg-gradient-to-br from-pomodo-orange to-pomodo-red':
            !timer.isRunning &&
            timer.mode === TimerMode.FOCUS &&
            canStart,
        },
        {
          'bg-gradient-to-br from-green-400 to-green-700':
            !timer.isRunning && timer.mode === TimerMode.REST,
        },
        { 'bg-gradient-to-br from-gray-600 to-black': timer.isRunning },
        {
          'bg-gradient-to-br from-gray-900 to-black opacity-70':
            !timer.isRunning && timer.mode === TimerMode.FOCUS && !canStart,
        },
        {
          'hover:scale-105 shadow-fab hover:shadow-fab-hover':
            !timer.isRunning && canStart,
        },
      ]"
    >
      <Pause :size="32" v-if="timer.isRunning" />
      <Play :size="32" v-else />
    </button>

    <button
      data-testid="skip-timer"
      class="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
      :class="[
        { 'opacity-50': !allowSkip },
        isDark
          ? 'bg-dark-surface border border-dark-border text-text-secondary'
          : 'bg-transparent border-[3px] border-black text-black',
      ]"
      :disabled="!allowSkip"
      @click="timer.skip"
    >
      <SkipForward :size="20" />
    </button>
  </div>
</template>
