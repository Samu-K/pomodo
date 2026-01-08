<script setup lang="ts">
import { ChevronLeft, ChevronRight, Lock } from "lucide-vue-next";
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { Session } from "../../funcs/commands";
import { formatDuration } from "../../funcs/stats/date_handling";
import { useSettingsStore } from "../../stores/settings";
import { useUIStore } from "../../stores/ui";

// Track which day's tooltip is currently open (null = none open)
const openTooltipDay = ref<number | null>(null);

// Close tooltip on scroll
const handleScroll = () => {
	openTooltipDay.value = null;
};

onMounted(() => {
	// Listen for scroll on the window and any scrollable parent
	window.addEventListener("scroll", handleScroll, true);
});

onUnmounted(() => {
	window.removeEventListener("scroll", handleScroll, true);
});

const props = defineProps<{
	data: Session[];
}>();

const settingsStore = useSettingsStore();
const uiStore = useUIStore();

const currentDate = ref(new Date());

const monthName = computed(() => {
	return currentDate.value
		.toLocaleString("default", { month: "long" })
		.toUpperCase();
});

const daysInMonth = computed(() => {
	return new Date(
		currentDate.value.getFullYear(),
		currentDate.value.getMonth() + 1,
		0
	).getDate();
});

const firstDayOffset = computed(() => {
	const firstDay = new Date(
		currentDate.value.getFullYear(),
		currentDate.value.getMonth(),
		1
	);
	return firstDay.getDay();
});

const isTodayMonth = computed(() => {
	const now = new Date();
	return (
		currentDate.value.getFullYear() === now.getFullYear() &&
		currentDate.value.getMonth() === now.getMonth()
	);
});

const canGoNext = computed(() => {
	return !isTodayMonth.value;
});

function prevMonth() {
	if (!settingsStore.isPremium) {
		uiStore.setPremiumModal(true);
		return;
	}
	currentDate.value = new Date(
		currentDate.value.getFullYear(),
		currentDate.value.getMonth() - 1,
		1
	);
}

function nextMonth() {
	if (!canGoNext.value) return;
	currentDate.value = new Date(
		currentDate.value.getFullYear(),
		currentDate.value.getMonth() + 1,
		1
	);
}

const currentMonthData = computed(() => {
	const year = currentDate.value.getFullYear();
	const month = currentDate.value.getMonth();

	const dailyStats = new Map<number, number>();

	// Initialize with 0
	for (let i = 1; i <= daysInMonth.value; i++) {
		dailyStats.set(i, 0);
	}

	props.data.forEach((s) => {
		if (s.finished && s.start_time) {
			const date = new Date(s.start_time);
			if (date.getFullYear() === year && date.getMonth() === month) {
				const day = date.getDate();
				dailyStats.set(day, (dailyStats.get(day) || 0) + (s.duration || 0));
			}
		}
	});

	return Array.from(dailyStats.entries()).map(([day, seconds]) => ({
		day,
		seconds,
		formattedTime: formatDuration(seconds),
		intensity: getIntensity(seconds)
	}));
});

function getIntensity(seconds: number) {
	const hours = seconds / 3600;
	if (hours === 0) return 0;
	if (hours < 1) return 1;
	if (hours < 2) return 2;
	if (hours < 4) return 3;
	return 4;
}

const colorMap = {
	0: "bg-light-border dark:bg-dark-border/50 border border-light-border/50 dark:border-white/5",
	1: "bg-pomodo-orange/20 border border-pomodo-orange/10",
	2: "bg-pomodo-orange/40 border border-pomodo-orange/20",
	3: "bg-pomodo-orange/70 border border-pomodo-orange/30",
	4: "bg-pomodo-orange"
};

const legend = [
	{ label: "0h", intensity: 0 },
	{ label: "<1h", intensity: 1 },
	{ label: "1-2h", intensity: 2 },
	{ label: "2-4h", intensity: 3 },
	{ label: "4h+", intensity: 4 }
];
</script>

<template>
  <div class="mt-10">
    <div class="flex items-center justify-between mb-4">
        <!-- Month Navigation -->
        <div class="flex items-center gap-4">
            <button 
                @click="prevMonth"
                class="p-1 hover:bg-light-surface dark:hover:bg-dark-surface rounded-full transition-colors text-pomodo-orange"
            >
                <ChevronLeft :size="20" />
            </button>
            <h2 class="text-xl font-bold text-lightText-primary dark:text-white tracking-widest">{{ monthName }}</h2>
            <button 
                @click="nextMonth"
                :disabled="!canGoNext"
                class="p-1 hover:bg-light-surface dark:hover:bg-dark-surface rounded-full transition-colors text-pomodo-orange disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronRight :size="20" />
            </button>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-1.5">
            <span class="text-xs text-lightText-muted dark:text-text-muted mr-1">Less</span>
            <div 
                v-for="item in legend" 
                :key="item.intensity"
                class="w-3.5 h-3.5 rounded-[3px]"
                :class="colorMap[item.intensity as keyof typeof colorMap]"
            ></div>
            <span class="text-xs text-lightText-muted dark:text-text-muted ml-1">More</span>
        </div>
    </div>

    <!-- Heatmap Grid -->
    <div class="bg-light-surface dark:bg-dark-surface rounded-2xl p-8 border border-light-border dark:border-white/5">
        <div class="grid grid-cols-7 gap-3">
            <!-- Day labels -->
            <div v-for="day in ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']" :key="day" class="text-center text-[11px] font-bold text-lightText-muted dark:text-text-muted/60 mb-2">
                {{ day }}
            </div>

            <!-- Empty slots for alignment -->
            <div v-for="n in firstDayOffset" :key="`offset-${n}`" class="aspect-square"></div>

            <!-- Heatmap cells -->
            <v-tooltip
                v-for="item in currentMonthData"
                :key="item.day"
                location="top"
                offset="10"
                :model-value="openTooltipDay === item.day"
                :open-on-hover="false"
            >
                <template v-slot:activator="{ props: tooltipProps }">
                    <div 
                        v-bind="tooltipProps"
                        class="aspect-square rounded-lg transition-all duration-300 hover:ring-2 hover:ring-pomodo-orange/50 cursor-pointer"
                        :class="colorMap[item.intensity as keyof typeof colorMap]"
                    >
                    </div>
                </template>
                <div class="text-xs py-1 px-2">
                    <div class="font-bold">{{ monthName }} {{ item.day }}</div>
                    <div>{{ item.formattedTime }} focus</div>
                </div>
            </v-tooltip>
        </div>
    </div>

    <!-- Premium Paywall Message -->
    <div v-if="!settingsStore.isPremium" class="mt-6 flex flex-col items-center">
        <div class="h-[1px] w-full bg-gradient-to-r from-transparent via-light-border dark:via-dark-border to-transparent mb-4"></div>
        <p class="text-sm text-center text-lightText-muted dark:text-text-muted flex items-center gap-2">
            Showing current month. 
            <button 
                @click="uiStore.setPremiumModal(true)"
                class="text-pomodo-orange font-semibold hover:underline flex items-center gap-1"
            >
                <Lock :size="14" />
                Upgrade to see all history.
            </button>
        </p>
    </div>
  </div>
</template>

<style scoped>
.aspect-square {
    aspect-ratio: 1 / 1;
}

/* Ensure tooltips background matches theme */
:global(.v-tooltip > .v-overlay__content) {
  background: white !important;
  color: #1a1a1a !important;
  border: 1px solid #e0e0e0 !important;
}

:global(.dark .v-tooltip > .v-overlay__content) {
  background: #2d333b !important;
  color: white !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
}
</style>
