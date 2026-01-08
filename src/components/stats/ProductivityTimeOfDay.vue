<script setup lang="ts">
import { computed } from "vue";
import { useTheme } from "vuetify";
import type { Session } from "../../funcs/commands";

const props = defineProps<{
	sessions: Session[];
}>();

const theme = useTheme();

const series = computed(() => {
	const hours = new Array(24).fill(0);
	props.sessions.forEach((s) => {
		if (!s.start_time || !s.duration) return;
		const hour = new Date(s.start_time).getHours();
		hours[hour] += s.duration / 60; // Convert to minutes
	});

	return hours.map((h) => Math.round(h));
});

const chartOptions = computed(() => {
	const isDark = theme.global.current.value.dark;
	return {
		chart: {
			type: "polarArea",
			toolbar: { show: false },
			background: "transparent",
			fontFamily: "inherit"
		},
		labels: Array.from({ length: 24 }, (_, i) => i.toString()),
		fill: {
			opacity: 0.8
		},
		stroke: {
			width: 1,
			colors: [isDark ? "#2a2a3a" : "#fff"]
		},
		plotOptions: {
			polarArea: {
				rings: {
					strokeWidth: 1,
					strokeColor: isDark ? "#3a3a4a" : "#e0e0e0"
				},
				spokes: {
					strokeWidth: 1,
					connectorColors: isDark ? "#3a3a4a" : "#e0e0e0"
				}
			}
		},
		xaxis: {
			type: "category",
			labels: {
				show: true,
				style: {
					colors: isDark ? "#888" : "#666",
					fontSize: "12px"
				}
			},
			axisBorder: {
				show: false
			},
			axisTicks: {
				show: false
			}
		},
		yaxis: {
			show: false
		},
		legend: {
			show: false
		},
		grid: {
			show: false
		},
		tooltip: {
			theme: isDark ? "dark" : "light",
			y: {
				formatter: (val: number) => `${val} mins`
			}
		},
		colors: ["#00897B"]
	};
});
</script>

<template>
	<div class="bg-light-surface dark:bg-dark-surface rounded-xl p-4 border border-light-border dark:border-dark-border">
		<h3 class="text-lg font-semibold text-lightText-primary dark:text-white mb-4">Productivity by Time of Day</h3>
		<apexchart
			type="polarArea"
			height="350"
			:options="chartOptions"
			:series="series"
		></apexchart>
	</div>
</template>
