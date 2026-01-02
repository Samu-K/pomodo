<script setup lang="ts">
import { Calendar, Check, MoreVertical, Plus } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import CreateTaskModal from "../../components/task/CreateTaskModal.vue";
import TaskDetailsModal from "../../components/task/TaskDetailsModal.vue";
import type { Task } from "../../defines/task";
import { useCategoryStore } from "../../stores/categories";
import { useTasks } from "../../stores/task";

const tasksStore = useTasks();
const categoryStore = useCategoryStore();

const showCreateModal = ref(false);
const showDetailsModal = ref(false);
const selectedTask = ref<Task | null>(null);

onMounted(async () => {
	if (tasksStore.tasks.length === 0) {
		await tasksStore.fetchTasks();
	}
	if (categoryStore.categories.length === 0) {
		await categoryStore.fetchCategories();
	}
});

// Group tasks by category
const groupedTasks = computed(() => {
	const groups: { categoryId: number | null; name: string; tasks: Task[] }[] =
		[];

	// 1. Existing Categories
	categoryStore.categories.forEach((cat) => {
		const tasks = tasksStore.tasks.filter(
			(t) => t.category_id === cat.id && !t.completed
		);
		if (tasks.length > 0) {
			groups.push({
				categoryId: cat.id,
				name: cat.name,
				tasks: tasks
			});
		}
	});

	// 2. Uncategorized
	const uncategorized = tasksStore.tasks.filter(
		(t) => !t.category_id && !t.completed
	);
	if (uncategorized.length > 0) {
		groups.push({
			categoryId: null,
			name: "Uncategorized",
			tasks: uncategorized
		});
	}

	// 3. Completed
	const completed = tasksStore.tasks.filter((t) => t.completed);
	if (completed.length > 0) {
		groups.push({
			categoryId: -1, // Special ID for completed
			name: "Completed",
			tasks: completed
		});
	}

	return groups;
});

const openDetails = (task: Task) => {
	selectedTask.value = task;
	showDetailsModal.value = true;
};

const handleTaskComplete = async (task: Task) => {
	await tasksStore.toggleTaskCompletion(task);
};
</script>

<template>
  <div class="h-full flex flex-col p-6 bg-light-bg dark:bg-dark-bg text-lightText-primary dark:text-text-primary overflow-hidden">
    
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
        <div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-pomodo-orange to-pomodo-red bg-clip-text text-transparent">
                My Tasks
            </h1>
            <p class="text-text-muted text-sm mt-1">Manage your focus goals</p>
        </div>
        <button 
            data-testid="add-task-fab"
            @click="showCreateModal = true"
            class="w-12 h-12 rounded-full bg-gradient-to-r from-pomodo-orange to-pomodo-red text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
            <Plus :size="24" />
        </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto space-y-8 pb-20">
        
        <div v-if="tasksStore.tasks.length === 0" class="flex flex-col items-center justify-center h-full text-text-muted">
            <p>No tasks found.</p>
            <p class="text-sm">Tap + to create one.</p>
        </div>

        <div v-for="group in groupedTasks" :key="group.categoryId ?? 'uncat'" class="animate-fade-in">
            <h2 class="text-lg font-semibold mb-3 px-1 text-text-secondary sticky top-0 bg-light-bg dark:bg-dark-bg z-10 py-2">
                {{ group.name }}
                <span class="text-xs font-normal text-text-muted ml-2">({{ group.tasks.length }})</span>
            </h2>
            
            <div class="space-y-3">
                <div 
                    v-for="task in group.tasks" 
                    :key="task.id"
                    class="group relative bg-light-surface dark:bg-dark-surface rounded-xl p-4 border border-light-border dark:border-dark-border hover:border-pomodo-orange transition-all active:scale-[0.99]"
                    @click="openDetails(task)"
                >
                    <div class="flex items-center gap-4">
                        <!-- Custom Checkbox -->
                        <div 
                            @click.stop="handleTaskComplete(task)"
                            class="w-6 h-6 rounded-full border-2 border-text-muted flex items-center justify-center cursor-pointer hover:border-pomodo-orange hover:text-pomodo-orange transition-colors shrink-0"
                            :class="{'bg-pomodo-orange border-pomodo-orange text-white': task.completed}"
                        >
                            <Check v-if="task.completed" :size="14" stroke-width="3" />
                        </div>

                        <div class="flex-1 min-w-0">
                            <h3 class="font-medium truncate pr-2" :class="{'line-through text-text-muted': task.completed}">
                                {{ task.title }}
                            </h3>
                            <div class="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                                <span>{{ task.completedCycles }} / {{ task.cycles }} cycles</span>
                                <span v-if="task.recurrence_rule" class="flex items-center gap-1 text-pomodo-orange ml-2">
                                    <Calendar :size="12" /> Recurring
                                </span>
                            </div>
                        </div>

                        <!-- Action/Edit Icon -->
                         <div class="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical :size="18" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>

    <!-- Modals -->
    <CreateTaskModal 
        v-if="showCreateModal" 
        @close="showCreateModal = false"
    />

    <TaskDetailsModal
        v-if="showDetailsModal && selectedTask"
        :selTask="selectedTask"
        @close="() => { showDetailsModal = false; selectedTask = null; }"
    />

  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
