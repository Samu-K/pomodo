<script setup lang="ts">
import { Maximize2, Pause, Play } from "lucide-vue-next";
import { TimerMode } from "../../../stores/timer";

defineProps<{
	taskId: string | null;
	projectId: number | null;
	selectedTaskTitle?: string;
	selectedProjectName?: string;
	selectedCategoryName?: string;
	formattedTime: string;
	themeColor: string;
	isRunning: boolean;
	mode: TimerMode;
	canStart: boolean;
}>();

const emit = defineEmits<{
	(e: "toggle-timer"): void;
	(e: "toggle-mini-mode"): void;
}>();
</script>

<template>
  <div class="flex flex-row items-center justify-between px-6 bg-black h-full w-full overflow-hidden border border-dark-border">
    <div class="flex flex-col flex-1 min-w-0 justify-center">
      <div class="text-[10px] uppercase tracking-wider text-text-muted truncate mb-0.5">
        {{ selectedTaskTitle || selectedProjectName || selectedCategoryName }}
      </div>
      <div :class="`text-4xl font-mono font-bold text-${themeColor}`">
        {{ formattedTime }}
      </div>
    </div>
    
    <div class="flex items-center gap-3">
      <button 
        data-testid="mini-toggle-timer"
        @click="emit('toggle-timer')"
        :disabled="!canStart"
        class="p-2 rounded-full flex items-center justify-center transition-colors"
        :class="`bg-${themeColor}/10 text-${themeColor}`"
      >
        <Pause :size="24" v-if="isRunning"/>
        <Play :size="24" v-else/>
      </button>
      <button data-testid="mini-maximize" @click="emit('toggle-mini-mode')" class="p-2 text-text-muted hover:text-white">
        <Maximize2 :size="20"/>
      </button>
    </div>
  </div>
</template>
