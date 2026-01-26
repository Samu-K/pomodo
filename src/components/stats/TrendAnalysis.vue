<script setup lang="ts">
import { computed } from "vue";
import { useTheme } from "vuetify";
import type { Session } from "../../funcs/commands";
import { isSameWeek } from "../../funcs/stats/date_handling";

const props = defineProps<{
	sessions: Session[];
}>();

const theme = useTheme();

const series = computed(() => {
	// Current Week vs Last Week
	const now = new Date();
	const lastWeek = new Date();
	lastWeek.setDate(lastWeek.getDate() - 7);

	const currentWeekData = new Array(7).fill(0);
	const lastWeekData = new Array(7).fill(0);

	// Helper to get day index 0-6 (Mon-Sun)
	const getDayIndex = (date: Date) => (date.getDay() + 6) % 7;

	props.sessions.forEach((s) => {
		if (!s.start_time || !s.duration) return;
		const d = new Date(s.start_time);

		if (isSameWeek(d)) {
			currentWeekData[getDayIndex(d)] += s.duration / 60;
		} else {
			const diffTime = Math.abs(now.getTime() - d.getTime());
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
			if (diffDays > 7 && diffDays <= 14) {
				// Map to same day of week
				lastWeekData[getDayIndex(d)] += s.duration / 60;
			}
		}
	});

	return [
		{
			name: "This Week",
			data: currentWeekData.map((val) => Math.round(val))
		},
		{
			name: "Last Week",
			data: lastWeekData.map((val) => Math.round(val))
		}
	];
});

const chartOptions = computed(() => {
	const isDark = theme.global.current.value.dark;
	return {
		chart: {
			type: "area",
			toolbar: { show: false },
			background: "transparent",
			fontFamily: "inherit"
		},
		stroke: { curve: "smooth", width: 2 },
		dataLabels: { enabled: false },
		fill: {
			type: "gradient",
			gradient: {
				shadeIntensity: 1,
				opacityFrom: 0.4,
				opacityTo: 0.1,
				stops: [0, 90, 100]
			}
		},
		xaxis: {
			categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
			labels: {
				style: { colors: isDark ? "#888" : "#666" }
			},
			axisBorder: { show: false },
			axisTicks: { show: false }
		},
		yaxis: {
			show: false
		},
		grid: {
			borderColor: isDark ? "#333" : "#e0e0e0",
			strokeDashArray: 4
		},
		tooltip: {
			theme: isDark ? "dark" : "light"
		},
		colors: ["#b8744f", "#666666"]
	};
});
</script>

<template>
	<div class="bg-light-surface dark:bg-dark-surface rounded-xl p-4 border border-light-border dark:border-dark-border">
		<h3 class="text-lg font-semibold text-lightText-primary dark:text-white mb-4">Trend Analysis</h3>
		<apexchart
			type="area"
			height="250"
			:options="chartOptions"
			:series="series"
		></apexchart>
	</div>
</template>
