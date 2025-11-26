<script setup lang="ts">
import { Pause, Play, RotateCcw, SkipForward } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import CategoryManager from "../../components/timer/CategoryManager.vue";

import { useCategoryStore } from "../../stores/categories";
import { TimerMode, useTimerStore } from "../../stores/timer";

const timer = useTimerStore();
const categoryStore = useCategoryStore();

onMounted(() => {
	if (categoryStore.categories.length === 0) {
		categoryStore.fetchCategories();
	}
});

const selectedCategory = computed(() => {
	if (!timer.categoryId) return null;
	return (
		categoryStore.categories.find((c) => c.id === timer.categoryId) || null
	);
});

const themeColor = computed(() =>
	timer.mode === TimerMode.FOCUS ? "pomodo-orange" : "green"
);

const showCategorySelector = computed(() => {
	// Only show selector if timer is NOT running AND is fully reset
	return !timer.isRunning && timer.percent >= 100;
});

const allowSkip = computed(() => {
	if (timer.mode === TimerMode.REST) return true;
	// Focus mode: only if paused
	return !timer.isRunning;
});

const allowReset = computed(() => {
	if (timer.mode === TimerMode.REST) return false;
	// Focus mode: only if paused
	return !timer.isRunning && timer.percent < 100;
});
const categoryStyle = computed(() => {
	const color = selectedCategory.value?.color;
	let hexColor = "#888888"; // Default grey

	if (color) {
		if (color.startsWith("#")) {
			hexColor = color;
		} else {
			// Map legacy names
			const colorMap: Record<string, string> = {
				orange: "#b8744f",
				red: "#c75450",
				green: "#43A047",
				purple: "#8E24AA",
				"pomodo-orange": "#b8744f"
			};
			hexColor = colorMap[color] || "#b8744f";
		}
	} else {
		// No category selected (e.g. deleted while running)
		return {
			backgroundColor: "rgba(136, 136, 136, 0.1)",
			color: "#888888",
			borderColor: "rgba(136, 136, 136, 0.2)"
		};
	}

	// Convert hex to rgba for background
	const r = parseInt(hexColor.slice(1, 3), 16);
	const g = parseInt(hexColor.slice(3, 5), 16);
	const b = parseInt(hexColor.slice(5, 7), 16);

	return {
		backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
		color: hexColor,
		borderColor: `rgba(${r}, ${g}, ${b}, 0.2)`
	};
});

// Hold to pause logic
const holdProgress = ref(0);
let holdInterval: number | undefined;
const HOLD_DURATION = 3000; // 3 seconds
const UPDATE_INTERVAL = 50; // Update every 50ms

const isFocusRunning = computed(
	() => timer.isRunning && timer.mode === TimerMode.FOCUS
);

const startHold = () => {
	if (!isFocusRunning.value) return;

	holdProgress.value = 0;
	holdInterval = window.setInterval(() => {
		holdProgress.value += (UPDATE_INTERVAL / HOLD_DURATION) * 100;

		if (holdProgress.value >= 100) {
			completeHold();
		}
	}, UPDATE_INTERVAL);
};

const endHold = () => {
	if (holdInterval) {
		clearInterval(holdInterval);
		holdInterval = undefined;
	}
	holdProgress.value = 0;
};

const completeHold = () => {
	endHold();
	timer.pauseTimer();
};
</script>

<template>
    <div 
        class="flex flex-col h-full relative select-none touch-none transition-colors duration-500"
        :class="isFocusRunning ? 'bg-black' : 'bg-dark-bg'"
        @mousedown="startHold"
        @touchstart="startHold"
        @mouseup="endHold"
        @touchend="endHold"
        @mouseleave="endHold"
    >
        <!-- Hold Progress Overlay, Circle that starts from middle of screen-->
         <div class="absolute bottom-0 right-0 top-0 left-0 items-center justify-center flex flex-col" >
            <div 
                v-if="isFocusRunning"
                class="bg-dark-bg pointer-events-none z-0 transition-all duration-75 rounded-full"
                :style="{ width: `${holdProgress*12}px`, height: `${holdProgress*12}px` }"
            ></div>
         </div>
        
        <div v-if="!timer.isReady" class="flex-1 flex items-center justify-center">
             <v-progress-circular indeterminate color="primary" />
        </div>

        <div v-else class="flex-1 flex flex-col items-center justify-center px-6 gap-10 z-10">
      <div v-if="!isFocusRunning" class="text-pomodo-orange text-2xl ">
        {{timer.sessionStreak}} / {{timer.long_break_interval}}
      </div>
            <v-progress-circular 
                :model-value="timer.percent" 
                :color="themeColor" 
                :size="170" 
                width="10" 
                z-index='2'
            ></v-progress-circular>

            <div :class="(`-mb-12 text-2xl text-${themeColor}`)">
                {{ timer.mode === TimerMode.FOCUS ? 'FOCUS' : 'REST' }}
            </div>

            <div :class="(`text-timer text-${themeColor} mt-12`)">
                {{ timer.formattedTime }}
            </div>

            <div class="w-64 h-22" v-if="timer.mode === TimerMode.FOCUS">
                <div v-if="showCategorySelector" class="flex items-center justify-center">
                    <CategoryManager 
                        :selectedCategory="selectedCategory"
                        @select="(cat) => timer.setCategoryId(cat.id)"
                    />
                </div>
                <div v-else 
                     class="flex items-center justify-center px-6 py-2 rounded-full border transition-all -mt-5 mx-auto w-fit"
                     :style="categoryStyle">
                    <span class="text-lg font-medium tracking-wide truncate max-w-[200px]">
                        {{ selectedCategory ? selectedCategory.name : "No category selected" }}
                    </span>
                </div>
            </div>
            
            <div v-if="isFocusRunning" class="text-text-muted text-sm animate-pulse">
                Hold to pause
            </div>
        </div>

        <div v-if="!isFocusRunning" class="flex items-center justify-center gap-8 w-full pb-8 z-10">
            <button 
                @click="timer.resetTimer"
                class="w-12 h-12 rounded-full bg-dark-surface border border-dark-border text-text-secondary flex items-center justify-center"
                :disabled="!allowReset"
            >
                <RotateCcw :size="20" :class="{'opacity-50': !allowReset}"/>
            </button>
            
            <button 
                @click="timer.toggleTimer"
                :disabled="timer.mode === TimerMode.FOCUS && !selectedCategory"
                class="w-20 h-20 rounded-full text-white flex items-center justify-center transition-transform"
                :class="[
                    {'bg-gradient-to-br from-pomodo-orange to-pomodo-red': !timer.isRunning && timer.mode === TimerMode.FOCUS && selectedCategory},
                    {'bg-gradient-to-br from-green-400 to-green-700': !timer.isRunning && timer.mode === TimerMode.REST},
                    {'bg-gradient-to-br from-gray-600 to-black': timer.isRunning},
                    {'bg-gradient-to-br from-gray-900 to-black opacity-70': timer.mode === TimerMode.FOCUS && !selectedCategory},
                    {'hover:scale-105 shadow-fab hover:shadow-fab-hover': !timer.isRunning && (timer.mode === TimerMode.REST || selectedCategory)}
                ]"
            >
                <Pause :size="32" v-if="timer.isRunning"/>
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
</template>
