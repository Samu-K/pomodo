<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
	Check,
	ChevronDown,
	ChevronLeft,
	ChevronUp,
	Trash,
	X
} from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import ConfirmationModal from "../../components/ui/ConfirmationModal.vue";
import { get_categories } from "../../funcs/db/categories";
import { delete_session, get_sessions } from "../../funcs/db/session";
import { formatDuration } from "../../funcs/stats/date_handling";
import { useProjectStore } from "../../stores/project";
import { useTasks } from "../../stores/task";

const queryClient = useQueryClient();
const router = useRouter();
const tasksStore = useTasks();
const projectStore = useProjectStore();

const categoriesState = useQuery({
	queryKey: ["categories"],
	queryFn: get_categories
});

const sessionsState = useQuery({
	queryKey: ["sessions"],
	queryFn: get_sessions
});

const deleteSessionMutation = useMutation({
	mutationFn: delete_session,
	onSuccess: () => {
		queryClient.invalidateQueries({ queryKey: ["sessions"] });
	}
});

const selectedYear = ref(new Date().getFullYear());
const expandedPanel = ref<number | undefined>(undefined);

onMounted(async () => {
	if (tasksStore.tasks.length === 0) {
		await tasksStore.fetchTasks();
	}
	if (projectStore.projects.length === 0) {
		await projectStore.fetchProjects();
	}
});

const processedSessions = computed(() => {
	if (!sessionsState.data.value) return [];

	const cats = categoriesState.data.value || [];
	const catMap = new Map(cats.map((c) => [c.id, c]));

	// Maps for tasks and projects
	const taskMap = new Map(tasksStore.tasks.map((t) => [t.id, t]));
	const projectMap = new Map(projectStore.projects.map((p) => [p.id, p]));

	return [...sessionsState.data.value]
		.filter((s): s is typeof s & { start_time: string } => !!s.start_time)
		.map((s) => {
			const date = new Date(s.start_time);
			const cat = s.category_id ? catMap.get(s.category_id) : null;

			// Determine display name
			let displayName = "Uncategorized";

			if (s.task_id && taskMap.has(s.task_id)) {
				displayName = taskMap.get(s.task_id)?.title ?? "Uncategorized";
			} else if (s.project_id && projectMap.has(s.project_id)) {
				displayName = projectMap.get(s.project_id)?.name ?? "Uncategorized";
			} else if (cat) {
				displayName = cat.name;
			}

			// If it's a task, try to use its project/category color, otherwise valid category color, else default
			let color = "bg-pomodo-orange";
			if (cat?.color) {
				color = `bg-${cat.color}`;
			}

			return {
				...s,
				dateObj: date,
				year: date.getFullYear(),
				monthIndex: date.getMonth(),
				monthName: date.toLocaleDateString(undefined, { month: "long" }),
				displayName: displayName,
				categoryColor: color,
				formattedDate: date.toLocaleDateString(undefined, {
					month: "short",
					day: "numeric",
					hour: "2-digit",
					minute: "2-digit"
				})
			};
		})
		.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
});

const availableYears = computed(() => {
	const years = new Set(processedSessions.value.map((s) => s.year));
	const currentYear = new Date().getFullYear();
	years.add(currentYear);
	return Array.from(years).sort((a, b) => b - a);
});

const groupedSessions = computed(() => {
	const filtered = processedSessions.value.filter(
		(s) => s.year === selectedYear.value
	);

	const groups = new Map<string, typeof filtered>();

	// Create groups for all months that have data
	filtered.forEach((session) => {
		let group = groups.get(session.monthName);
		if (!group) {
			group = [];
			groups.set(session.monthName, group);
		}
		group.push(session);
	});

	// Convert to array and sort by month index (descending)
	return Array.from(groups.entries())
		.map(([monthName, sessions]) => ({
			monthName,
			monthIndex: sessions[0].monthIndex,
			sessions
		}))
		.sort((a, b) => b.monthIndex - a.monthIndex);
});

// Set initial expanded panel to current month
watch(
	groupedSessions,
	(newGroups) => {
		if (expandedPanel.value === undefined && newGroups.length > 0) {
			const currentMonthIndex = new Date().getMonth();
			const groupIndex = newGroups.findIndex(
				(g) => g.monthIndex === currentMonthIndex
			);
			if (groupIndex !== -1) {
				expandedPanel.value = groupIndex;
			} else {
				expandedPanel.value = 0; // Default to first (newest) if current month not found
			}
		}
	},
	{ immediate: true }
);

const sessionToDelete = ref<number | null>(null);

const handleDelete = (id: number) => {
	sessionToDelete.value = id;
};

const confirmDelete = () => {
	if (sessionToDelete.value !== null) {
		deleteSessionMutation.mutate(sessionToDelete.value);
		sessionToDelete.value = null;
	}
};

const cancelDelete = () => {
	sessionToDelete.value = null;
};
</script>

<template>
	<div class="flex flex-col h-full bg-light-bg dark:bg-dark-bg">
		<div class="flex-1 overflow-y-auto px-6 py-6">
			<div class="flex items-center justify-between mb-6">
				<div class="flex items-center gap-2">
					<button 
						@click="router.back()"
						class="w-8 h-8 flex items-center justify-center text-pomodo-orange hover:bg-light-surface dark:hover:bg-dark-surface rounded-lg transition-colors"
					>
						<ChevronLeft :size="24" />
					</button>
					<h1 class="text-2xl font-semibold text-pomodo-orange">
						Session Log
					</h1>
				</div>
				<div class="w-32">
					<v-select
						v-model="selectedYear"
						:items="availableYears"
						density="compact"
						variant="outlined"
						hide-details
						bg-color="transparent"
						color="primary"
					></v-select>
				</div>
			</div>

			<div v-if="sessionsState.isLoading.value" class="text-center text-lightText-secondary dark:text-text-secondary mt-10">
				Loading sessions...
			</div>

			<div v-else-if="groupedSessions.length === 0" class="text-center text-lightText-secondary dark:text-text-secondary mt-10">
				No sessions found for {{ selectedYear }}.
			</div>

			<div v-else>
				<v-expansion-panels v-model="expandedPanel" variant="accordion">
					<v-expansion-panel
						v-for="(group, index) in groupedSessions"
						:key="group.monthName"
						:value="index"
						class="mb-2 bg-light-surface dark:bg-dark-surface rounded-lg overflow-hidden border border-light-border dark:border-dark-border"
						elevation="0"
					>
						<v-expansion-panel-title class="bg-light-surface dark:bg-dark-surface text-lightText-primary dark:text-white font-medium">
							{{ group.monthName }}
							<template v-slot:actions="{ expanded }">
								<v-icon :icon="expanded ? ChevronUp : ChevronDown" color="primary"></v-icon>
							</template>
						</v-expansion-panel-title>
						
						<v-expansion-panel-text class="bg-light-bg dark:bg-dark-bg">
							<div class="space-y-3 pt-3">
								<div 
									v-for="session in group.sessions" 
									:key="session.id || 0"
									class="flex items-center justify-between p-3 bg-light-surface dark:bg-dark-surface rounded-lg group border border-light-border dark:border-dark-border"
								>
									<div class="flex items-center gap-4">
										<div class="w-3 h-3 rounded-full" :class="session.categoryColor"></div>
										<div class="flex flex-col">
											<span class="text-lightText-primary dark:text-white font-medium">{{ session.displayName }}</span>
											<span class="text-lightText-secondary dark:text-text-secondary text-sm">{{ session.formattedDate }}</span>
										</div>
									</div>

									<div class="flex items-center gap-6">
										<span class="text-lightText-primary dark:text-white font-medium">{{ formatDuration(session.duration || 0) }}</span>
										<div v-if="session.finished" class="text-green-500" title="Completed">
											<Check :size="18" />
										</div>
										<div v-else class="text-red-500" title="Incomplete">
											<X :size="18" />
										</div>
										<button 
											v-if="session.id"
											@click.stop="handleDelete(session.id)"
											class="transition-colors hover:text-red-500"
											title="Delete session"
										>
											<Trash :size="18" />
										</button>
									</div>
								</div>
							</div>
						</v-expansion-panel-text>
					</v-expansion-panel>
				</v-expansion-panels>
			</div>
		</div>

		<!-- Delete Confirmation Modal -->
		<ConfirmationModal
			v-if="sessionToDelete !== null"
			title="Delete Session"
			message="Are you sure you want to delete this session? This action cannot be undone."
			primary-btn-text="Delete"
			secondary-btn-text="Cancel"
			:is-danger="true"
			@primary="confirmDelete"
			@secondary="cancelDelete"
			@close="cancelDelete"
		/>
	</div>
</template>

<style scoped>
:deep(.v-expansion-panel-title) {
	min-height: 48px;
}
:deep(.v-expansion-panel-text__wrapper) {
	padding: 0 16px 16px 16px;
}
:deep(.v-theme--dark) {
    --v-theme-surface: 30, 30, 30; /* Match bg-dark-surface */
}
</style>