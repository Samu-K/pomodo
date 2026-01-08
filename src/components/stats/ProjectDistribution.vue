<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useTheme } from "vuetify";
import type { Session } from "../../funcs/commands";
import { useCategoryStore } from "../../stores/categories";
import { useProjectStore } from "../../stores/project";

const props = defineProps<{
	sessions: Session[];
}>();

const theme = useTheme();
const categoryStore = useCategoryStore();
const projectStore = useProjectStore();

onMounted(() => {
	if (categoryStore.categories.length === 0) categoryStore.fetchCategories();
	if (projectStore.projects.length === 0) projectStore.fetchProjects();
});

const projectStats = computed(() => {
	const map = new Map<string, number>();

	props.sessions.forEach((s) => {
		if (!s.duration) return;

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

		map.set(name, (map.get(name) || 0) + s.duration);
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
				formatter: (val: number) => `${Math.round(val / 60)} mins`
			}
		},
		// Pomodo Palette
		colors: ["#b8744f", "#c75450", "#d4a373", "#8b5a3c", "#666666"]
	};
});
</script>

<template>
	<div class="bg-light-surface dark:bg-dark-surface rounded-xl p-4 border border-light-border dark:border-dark-border">
		<h3 class="text-lg font-semibold text-lightText-primary dark:text-white mb-4">Distribution by Category</h3>
		<apexchart
			type="donut"
			height="250"
			:options="chartOptions"
			:series="series"
		></apexchart>
	</div>
</template>
