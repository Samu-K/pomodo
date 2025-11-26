<script setup lang="ts">
import { Pause, Play, RotateCcw, SkipForward } from "lucide-vue-next";
import { computed, onMounted } from "vue";
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
</script>

<template>
    <div class="flex flex-col h-full bg-dark-bg">
        
        <div v-if="!timer.isReady" class="flex-1 flex items-center justify-center">
             <v-progress-circular indeterminate color="primary" />
        </div>

        <div v-else class="flex-1 flex flex-col items-center justify-center px-6 gap-10">
      <div class="text-pomodo-orange text-2xl ">
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
                     :class="`text-3xl text-${selectedCategory ? selectedCategory.color : 'pomodo-orange'} text-center -mt-10`">
                    {{ selectedCategory ? selectedCategory.name : "No category selected" }}
                </div>
            </div>
        </div>

        <div class="flex items-center justify-center gap-8 w-full pb-8">
            <button 
                @click="timer.resetTimer"
                class="w-12 h-12 rounded-full bg-dark-surface border border-dark-border text-text-secondary flex items-center justify-center"
                :disabled="!allowReset"
            >
                <RotateCcw :size="20" :class="{'opacity-50': !allowReset}"/>
            </button>
            
            <button 
                @click="timer.toggleTimer"
                :disabled="!selectedCategory"
                class="w-20 h-20 rounded-full text-white flex items-center justify-center transition-transform"
                :class="[
                    {'bg-gradient-to-br from-pomodo-orange to-pomodo-red': !timer.isRunning && timer.mode === TimerMode.FOCUS && selectedCategory},
                    {'bg-gradient-to-br from-green-400 to-green-700': !timer.isRunning && timer.mode === TimerMode.REST},
                    {'bg-gradient-to-br from-gray-600 to-black': timer.isRunning},
                    {'bg-gradient-to-br from-gray-900 to-black opacity-70': !selectedCategory},
                    {'hover:scale-105 shadow-fab hover:shadow-fab-hover': selectedCategory}
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
