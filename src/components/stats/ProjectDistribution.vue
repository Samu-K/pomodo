<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useTheme } from "vuetify";
import type { Session } from "../../funcs/commands";
import { fromUTCString, isToday } from "../../funcs/stats/date_handling";
import { useCategoryStore } from "../../stores/categories";
import { useProjectStore } from "../../stores/project";

const props = defineProps<{
	sessions: Session[];
}>();

const theme = useTheme();
const categoryStore = useCategoryStore();
const projectStore = useProjectStore();

type Timeframe = "1D" | "1M" | "1Y" | "YTD";
const timeframes: Timeframe[] = ["1D", "1M", "1Y", "YTD"];
const selectedTimeframe = ref<Timeframe>("1D");

onMounted(() => {
	if (categoryStore.categories.length === 0) categoryStore.fetchCategories();
	if (projectStore.projects.length === 0) projectStore.fetchProjects();
});

const filteredSessions = computed(() => {
	const now = new Date();
	const sessions = props.sessions.filter((s) => s.duration);

	switch (selectedTimeframe.value) {
		case "1D":
			return sessions.filter(
				(s) => s.start_time && isToday(fromUTCString(s.start_time))
			);
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

const projectStats = computed(() => {
	const map = new Map<string, number>();

	filteredSessions.value.forEach((s) => {
		let name = "Uncategorized";
		if (s.project_id) {
			const project = projectStore.projects.find((p) => p.id === s.project_id);
			name = project ? project.name : `Project #${s.project_id}`;
		} else if (s.category_id) {
			const category = categoryStore.categories.find(
				(c) => c.id === s.category_id
			);
			name = category ? category.name : `Category #${s.category_id}`;
		}

		map.set(name, (map.get(name) || 0) + (s.duration || 0));
	});

	return Array.from(map.entries())
		.map(([name, duration]) => ({ name, duration }))
		.sort((a, b) => b.duration - a.duration)
		.slice(0, 5); // Top 5
});

const series = computed(() => projectStats.value.map((s) => s.duration));
const labels = computed(() => projectStats.value.map((s) => s.name));

const chartOptions = computed(() => {
	const isDark = theme.global.current.value.dark;
	return {
		chart: {
			type: "donut",
			background: "transparent",
			fontFamily: "inherit"
		},
		labels: labels.value,
		stroke: { show: false },
		plotOptions: {
			pie: {
				donut: {
					size: "70%"
				}
			}
		},
		dataLabels: { enabled: false },
		legend: {
			position: "bottom",
			labels: {
				colors: isDark ? "#fff" : "#333"
			}
		},
		tooltip: {
			theme: isDark ? "dark" : "light",
			y: {
				formatter: (val: number) => {
					// Format minutes/hours based on magnitude
					const mins = Math.round(val / 60);
					if (mins >= 60) {
						const h = Math.floor(mins / 60);
						const m = mins % 60;
						return m > 0 ? `${h}h ${m}m` : `${h}h`;
					}
					return `${mins} mins`;
				}
			}
		},
		// Pomodo Palette
		colors: ["#b8744f", "#c75450", "#d4a373", "#8b5a3c", "#666666"]
	};
});
</script>

<template>
	<div class="bg-light-surface dark:bg-dark-surface rounded-xl p-4 border border-light-border dark:border-dark-border">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-semibold text-lightText-primary dark:text-white">Distribution by Category</h3>
			
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
			type="donut"
			height="250"
			:options="chartOptions"
			:series="series"
		></apexchart>
	</div>
</template>
