<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Eye, EyeOff, ChevronDown, ChevronRight } from "lucide-vue-next";
import EmptyState from "../../components/ui/EmptyState.vue";
import CreateTaskModal from "../../components/task/CreateTaskModal.vue";
import TaskDetailsModal from "../../components/task/TaskDetailsModal.vue";
import QuickAddTask from "../../components/task/QuickAddTask.vue";
import TaskListItem from "../../components/task/TaskListItem.vue";
import Toast from "../../components/ui/Toast.vue";
import type { Task } from "../../defines/task";
import { useCategoryStore } from "../../stores/categories";
import { useTasks } from "../../stores/task";

const tasksStore = useTasks();
const categoryStore = useCategoryStore();

const showCreateModal = ref(false);
const showDetailsModal = ref(false);
const selectedTask = ref<Task | null>(null);
const showCompleted = ref(false);
const collapsedCategories = ref(new Set<number | null>());
const collapsedCompletedCategories = ref(new Set<number | null>());

onMounted(async () => {
	if (tasksStore.tasks.length === 0) {
		await tasksStore.fetchTasks();
	}
	if (categoryStore.categories.length === 0) {
		await categoryStore.fetchCategories();
	}
});

const toggleCategory = (id: number | null) => {
	if (collapsedCategories.value.has(id)) {
		collapsedCategories.value.delete(id);
	} else {
		collapsedCategories.value.add(id);
	}
};

const toggleCompletedCategory = (id: number | null) => {
	if (collapsedCompletedCategories.value.has(id)) {
		collapsedCompletedCategories.value.delete(id);
	} else {
		collapsedCompletedCategories.value.add(id);
	}
};

// Group tasks by category
const groupedTasks = computed(() => {
	const groups: { categoryId: number | null; name: string; tasks: Task[] }[] =
		[];

	// 1. Existing Categories
	for (const cat of categoryStore.categories) {
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
	}

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

	return groups;
});

// Group completed tasks by category
const groupedCompletedTasks = computed(() => {
	const groups: { categoryId: number | null; name: string; tasks: Task[] }[] =
		[];

	// 1. Existing Categories
	for (const cat of categoryStore.categories) {
		const tasks = tasksStore.tasks.filter(
			(t) => t.category_id === cat.id && t.completed
		);
		if (tasks.length > 0) {
			groups.push({
				categoryId: cat.id,
				name: cat.name,
				tasks: tasks
			});
		}
	}

	// 2. Uncategorized
	const uncategorized = tasksStore.tasks.filter(
		(t) => !t.category_id && t.completed
	);
	if (uncategorized.length > 0) {
		groups.push({
			categoryId: null,
			name: "Uncategorized",
			tasks: uncategorized
		});
	}

	return groups;
});

const hasCompletedTasks = computed(() => {
	return tasksStore.tasks.some((t) => t.completed);
});

const totalCompletedCount = computed(() => {
	return tasksStore.tasks.filter((t) => t.completed).length;
});

const openDetails = (task: Task) => {
	selectedTask.value = task;
	showDetailsModal.value = true;
};
</script>

<template>
  <div class="h-full flex flex-col pt-12 px-6 bg-light-bg dark:bg-dark-bg text-lightText-primary dark:text-text-primary overflow-hidden">
    
    <!-- Header -->
    <div class="flex items-end justify-between mb-8 px-2">
        <div>
            <h1 class="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-pomodo-orange to-pomodo-red bg-clip-text text-transparent">
                My Focus
            </h1>
            <p class="text-text-muted text-sm font-medium mt-1">Manage your goals and priorities</p>
        </div>
        <div class="text-right">
            <span class="text-2xl font-bold text-pomodo-orange">{{ tasksStore.tasks.length }}</span>
            <span class="text-text-muted text-xs font-bold uppercase ml-1">Total</span>
        </div>
    </div>

    <!-- Quick Add Bar -->
    <div class="mb-8 px-1">
        <QuickAddTask />
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto space-y-10 pb-24 scroll-smooth hide-scrollbar">
        
        <EmptyState 
            v-if="tasksStore.tasks.length === 0"
            title="Your task list is empty" 
            description="Start by adding your first focus goal above."
        />

        <div v-else v-for="group in groupedTasks" :key="group.categoryId ?? 'uncat'" class="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div 
                @click="toggleCategory(group.categoryId)"
                class="sticky top-0 bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-md z-10 py-3 mb-4 border-b border-light-border dark:border-dark-border flex items-center justify-between px-2 cursor-pointer group/header"
            >
                <h2 class="text-sm font-black uppercase tracking-widest text-text-muted flex items-center gap-2 group-hover/header:text-pomodo-orange transition-colors">
                    <component :is="collapsedCategories.has(group.categoryId) ? ChevronRight : ChevronDown" :size="16" />
                    {{ group.name }}
                    <span class="w-1 h-1 rounded-full bg-text-muted/30"></span>
                    <span class="opacity-60">{{ group.tasks.length }}</span>
                </h2>
            </div>
            
            <div v-if="!collapsedCategories.has(group.categoryId)" class="space-y-4 px-1">
                <TaskListItem 
                    v-for="task in group.tasks" 
                    :key="task.id"
                    :task="task"
                    @click="openDetails"
                />
            </div>
        </div>

        <!-- Completed Tasks Section -->
        <div v-if="hasCompletedTasks" class="pt-4 border-t border-light-border dark:border-dark-border mt-12 mb-10">
            <button 
                @click="showCompleted = !showCompleted"
                class="flex items-center gap-2 text-sm font-bold text-text-muted hover:text-pomodo-orange transition-colors px-2 mb-6 group"
            >
                <component :is="showCompleted ? EyeOff : Eye" :size="16" class="transition-transform group-hover:scale-110" />
                {{ showCompleted ? 'Hide' : 'Show' }} Completed Tasks ({{ totalCompletedCount }})
            </button>

            <div v-if="showCompleted" class="space-y-10 animate-in fade-in slide-in-from-top-2 duration-200">
                <div v-for="group in groupedCompletedTasks" :key="'comp-' + (group.categoryId ?? 'uncat')" class="px-1">
                    <div 
                        @click="toggleCompletedCategory(group.categoryId)"
                        class="flex items-center justify-between py-2 mb-4 border-b border-light-border/40 dark:border-dark-border/40 cursor-pointer group/comp-header"
                    >
                        <h3 class="text-xs font-black uppercase tracking-widest text-text-muted/50 flex items-center gap-2 px-1 group-hover/comp-header:text-pomodo-orange transition-colors">
                            <component :is="collapsedCompletedCategories.has(group.categoryId) ? ChevronRight : ChevronDown" :size="14" />
                            {{ group.name }}
                            <span class="w-1 h-1 rounded-full bg-text-muted/20"></span>
                            <span class="opacity-40">{{ group.tasks.length }}</span>
                        </h3>
                    </div>
                    <div v-if="!collapsedCompletedCategories.has(group.categoryId)" class="space-y-4">
                        <TaskListItem 
                            v-for="task in group.tasks" 
                            :key="task.id"
                            :task="task"
                            @click="openDetails"
                        />
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

    <!-- Task Details Modal -->
    <TaskDetailsModal
        v-if="showDetailsModal && selectedTask"
        :selTask="selectedTask"
        @close="() => { showDetailsModal = false; selectedTask = null; }"
    />

    <!-- Notifications -->
    <Toast />

  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
