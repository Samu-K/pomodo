<script setup lang="ts">
import { computed, ref } from "vue";
import { useTheme } from "vuetify";
import type { Session } from "../../funcs/commands";
import { fromUTCString, isToday } from "../../funcs/stats/date_handling";
import { calculateHourlyDistribution } from "../../funcs/stats/productivity";

const props = defineProps<{
	sessions: Session[];
}>();

const theme = useTheme();

type Timeframe = "1D" | "1M" | "1Y" | "YTD";
const timeframes: Timeframe[] = ["1D", "1M", "1Y", "YTD"];
const selectedTimeframe = ref<Timeframe>("1D");

const filteredSessions = computed(() => {
	const now = new Date();
	const sessions = props.sessions.filter((s) => s.start_time && s.duration);

	switch (selectedTimeframe.value) {
		case "1D":
			return sessions.filter((s) => isToday(fromUTCString(s.start_time)));
		case "1M": {
			const cutoff = new Date(now);
			cutoff.setDate(now.getDate() - 30);
			return sessions.filter(
				(s) => s.start_time && fromUTCString(s.start_time) >= cutoff
			);
		}
		case "1Y": {
			const cutoff = new Date(now);
			cutoff.setDate(now.getDate() - 365);
			return sessions.filter(
				(s) => s.start_time && fromUTCString(s.start_time) >= cutoff
			);
		}
		case "YTD": {
			const startOfYear = new Date(now.getFullYear(), 0, 1);
			return sessions.filter(
				(s) => s.start_time && fromUTCString(s.start_time) >= startOfYear
			);
		}
	}
});

const series = computed(() => {
	// If 1D, force total (divisor 1)
	const isDayView = selectedTimeframe.value === "1D";
	return calculateHourlyDistribution(filteredSessions.value, isDayView);
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
				formatter: (val: number) => {
					// Format based on timeframe
					if (selectedTimeframe.value === "1D") return `${val} mins`;
					return `${val} mins/day avg`;
				}
			}
		},
		colors: ["#00897B"]
	};
});
</script>

<template>
	<div class="bg-light-surface dark:bg-dark-surface rounded-xl p-4 border border-light-border dark:border-dark-border">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-semibold text-lightText-primary dark:text-white">Productivity by Time of Day</h3>
			
			<div class="flex bg-light-bg dark:bg-dark-bg rounded-lg p-1 gap-1">
				<button
					v-for="tf in timeframes"
					:key="tf"
					@click="selectedTimeframe = tf"
					class="px-2 py-0.5 text-xs font-medium rounded transition-colors"
					:class="selectedTimeframe === tf 
						? 'bg-light-surface dark:bg-dark-surface text-pomodo-orange shadow-sm' 
						: 'text-lightText-muted dark:text-text-muted hover:text-lightText-primary dark:hover:text-white'"
				>
					{{ tf }}
				</button>
			</div>
		</div>
		
		<apexchart
			type="polarArea"
			height="350"
			:options="chartOptions"
			:series="series"
		></apexchart>
	</div>
</template>
