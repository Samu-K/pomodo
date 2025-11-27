<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { Session } from "../../funcs/commands";

// 2. Receive data from parent
const props = defineProps<{
	data: Session[];
}>();

// 3. Internal Logic: Transform raw sessions into Chart Bars
const chartData = computed(() => {
	const days = ["M", "T", "W", "T", "F", "S", "S"];
	const dailyTotals = new Array(7).fill(0);

	// Aggregate
	const list = props.data || [];
	list.forEach((s) => {
		if (s.finished && s.start_time) {
			const d = new Date(s.start_time);
			// Convert Sunday(0)-Saturday(6) to Monday(0)-Sunday(6)
			const dayIndex = (d.getDay() + 6) % 7;
			dailyTotals[dayIndex] += s.duration;
		}
	});

	// Scale
	const maxDuration = Math.max(...dailyTotals, 1); // Prevent divide by zero

	// Map to View Model
	return days.map((label, index) => {
		const seconds = dailyTotals[index];
		return {
			label,
			valueDisplay: (seconds / 3600).toFixed(1),
			heightPercentage: Math.round((seconds / maxDuration) * 100),
			isToday: (new Date().getDay() + 6) % 7 === index
		};
	});
});

// 3. UI State (Local to this component)
const activeDayIndex = ref<number | null>(null);
const chartContainerRef = ref<HTMLElement | null>(null);

const toggleTooltip = (index: number) => {
	if (activeDayIndex.value === index) {
		activeDayIndex.value = null;
	} else {
		activeDayIndex.value = index;
	}
};

// 4. Click Outside Logic
const handleClickOutside = (event: MouseEvent) => {
	if (activeDayIndex.value !== null) {
		if (
			chartContainerRef.value &&
			!chartContainerRef.value.contains(event.target as Node)
		) {
			activeDayIndex.value = null;
		}
	}
};

// 5. Lifecycle Hooks for Event Listeners
onMounted(() => {
	document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
	document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <section class="mt-10">
    <h2 class="text-lg font-semibold text-lightText-primary dark:text-white mb-5">Activity Chart</h2>
    
    <div 
      ref="chartContainerRef"
      class="bg-light-surface dark:bg-dark-surface rounded-xl p-6 select-none"
    >
      
      <div class="flex items-end justify-between h-32 gap-2 mb-2">
        <div 
          v-for="(day, index) in chartData" 
          :key="index" 
          @click="toggleTooltip(index)"
          class="w-full h-full flex flex-col justify-end items-center relative cursor-pointer"
        >
          <div 
            class="absolute -top-10 transition-all duration-300 ease-out bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border px-2 py-1 rounded shadow-lg z-10"
            :class="activeDayIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'"
          >
            <span class="text-xs text-pomodo-orange font-mono font-bold">
              {{ day.valueDisplay }}h
            </span>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-light-bg dark:bg-dark-bg border-r border-b border-light-border dark:border-dark-border rotate-45"></div>
          </div>

          <div 
            class="w-full rounded-t-md transition-all duration-500 min-h-[4px]"
            :class="[
               day.isToday ? 'bg-pomodo-orange' : 'bg-light-border dark:bg-dark-bg/50',
               activeDayIndex === index 
                 ? '!bg-pomodo-orange brightness-110 shadow-[0_0_10px_rgba(249,115,22,0.3)]' 
                 : 'hover:bg-pomodo-orange/70'
            ]"
            :style="{ height: `${day.heightPercentage}%` }"
          ></div>
        </div>
      </div>

      <div class="flex justify-between gap-2 border-t border-light-border dark:border-dark-bg/30 pt-2">
        <div 
          v-for="(day, index) in chartData" 
          :key="index" 
          class="w-full text-center text-xs font-medium transition-colors"
          :class="[
            activeDayIndex === index ? 'text-white' : '',
            day.isToday && activeDayIndex !== index ? 'text-pomodo-orange' : 'text-lightText-muted dark:text-text-muted'
          ]"
        >
          {{ day.label }}
        </div>
      </div>

    </div>
  </section>
</template>
