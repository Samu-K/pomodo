<script setup lang="ts">
import { computed } from "vue";
import type { Session } from "../../funcs/commands";
import { formatDuration } from "../../funcs/stats/date_handling";

const props = defineProps<{
	data: Session[];
}>();

const daysInMonth = computed(() => {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
});

const currentMonthData = computed(() => {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();

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
	0: "bg-[#ebedf0] dark:bg-[#161b22] border border-black/5 dark:border-white/5",
	1: "bg-pomodo-orange/20 border border-pomodo-orange/10",
	2: "bg-pomodo-orange/40 border border-pomodo-orange/20",
	3: "bg-pomodo-orange/70 border border-pomodo-orange/30",
	4: "bg-pomodo-orange"
};

const monthName = computed(() => {
	return new Date().toLocaleString("default", { month: "long" });
});

// Calculate offset for the first day of the month (0 = Sunday, 1 = Monday, etc.)
const firstDayOffset = computed(() => {
	const now = new Date();
	const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
	return firstDay.getDay();
});

// Legend items
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
        <h2 class="text-lg font-semibold text-lightText-primary dark:text-white">Monthly Focus</h2>
        <div class="flex items-center gap-1">
            <span class="text-xs text-lightText-muted dark:text-text-muted mr-1">Less</span>
            <div 
                v-for="item in legend" 
                :key="item.intensity"
                class="w-3 h-3 rounded-sm"
                :class="colorMap[item.intensity as keyof typeof colorMap]"
                :title="item.label"
            ></div>
            <span class="text-xs text-lightText-muted dark:text-text-muted ml-1">More</span>
        </div>
    </div>

    <div class="bg-light-surface dark:bg-dark-surface rounded-xl p-6">
        <div class="grid grid-cols-7 gap-2">
            <!-- Day labels -->
            <div v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="day" class="text-center text-[10px] uppercase font-bold text-lightText-muted dark:text-text-muted mb-1">
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
                open-on-click
                open-on-hover
            >
                <template v-slot:activator="{ props }">
                    <div 
                        v-bind="props"
                        class="aspect-square rounded-md transition-colors duration-300 hover:ring-2 hover:ring-pomodo-orange/50 cursor-pointer"
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
  </div>
</template>

<style scoped>
/* Fallback for environments without Vuetify tooltips being globally configured or for specific styling needs */
.aspect-square {
    aspect-ratio: 1 / 1;
}
</style>
