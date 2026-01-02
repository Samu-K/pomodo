<script setup lang="ts">
import {
	Briefcase,
	Check,
	ChevronDown,
	ChevronRight,
	Plus,
	Trash2
} from "lucide-vue-next";
import { onMounted, ref } from "vue";
import CreateTaskModal from "../../components/task/CreateTaskModal.vue";
import TaskDetailsModal from "../../components/task/TaskDetailsModal.vue";
import type { Task } from "../../defines/task";
import type { Project } from "../../funcs/commands";
import { useCategoryStore } from "../../stores/categories";
import { useProjectStore } from "../../stores/project";
import { useTasks } from "../../stores/task";

const projectStore = useProjectStore();
const tasksStore = useTasks();
const categoryStore = useCategoryStore();

const showEditModal = ref(false);
const editingProject = ref<Project | null>(null);

const showCreateTaskModal = ref(false);
const selectedProjectIdForTask = ref<number | null>(null);

const showDetailsModal = ref(false);
const selectedTask = ref<Task | null>(null);

const expandedProjects = ref<Set<number>>(new Set());

onMounted(async () => {
	await projectStore.fetchProjects();
	await tasksStore.fetchTasks();
	if (categoryStore.categories.length === 0) {
		await categoryStore.fetchCategories();
	}
});

const toggleExpand = (id: number) => {
	if (expandedProjects.value.has(id)) {
		expandedProjects.value.delete(id);
	} else {
		expandedProjects.value.add(id);
	}
};

const getProjectTasks = (projectId: number) => {
	return tasksStore.tasks.filter((t) => t.project_id === projectId);
};

const openCreate = () => {
	editingProject.value = {
		id: 0,
		name: "",
		description: "",
		color: "pomodo-orange",
		estimated_pomodoros: 1,
		category_id: null,
		is_completed: false,
		created_at: null
	};
	showEditModal.value = true;
};

const openEdit = (project: Project) => {
	editingProject.value = { ...project };
	showEditModal.value = true;
};

const openAddTask = (projectId: number) => {
	selectedProjectIdForTask.value = projectId;
	showCreateTaskModal.value = true;
};

const openTaskDetails = (task: Task) => {
	selectedTask.value = task;
	showDetailsModal.value = true;
};

const handleTaskComplete = async (task: Task) => {
	await tasksStore.toggleTaskCompletion(task);
};

const saveProject = async () => {
	if (!editingProject.value) return;
	if (editingProject.value.id === 0) {
		await projectStore.addProject(editingProject.value);
	} else {
		await projectStore.updateProject(editingProject.value);
	}
	showEditModal.value = false;
};

const deleteProject = async (id: number) => {
	if (
		confirm(
			"Are you sure you want to delete this project? Tasks linked to this project will remain but will no longer be linked."
		)
	) {
		await projectStore.deleteProject(id);
	}
};
</script>

<template>
  <div class="h-full flex flex-col p-6 bg-light-bg dark:bg-dark-bg text-lightText-primary dark:text-text-primary overflow-hidden">
    
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
        <div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-pomodo-orange to-pomodo-red bg-clip-text text-transparent">
                Projects
            </h1>
            <p class="text-text-muted text-sm mt-1">Organize your work into containers</p>
        </div>
        <button 
            data-testid="add-project-btn"
            @click="openCreate"
            class="w-12 h-12 rounded-full bg-gradient-to-r from-pomodo-orange to-pomodo-red text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
            <Plus :size="24" />
        </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto space-y-4 pb-20">
        
        <div v-if="projectStore.projects.length === 0" class="flex flex-col items-center justify-center h-48 text-text-muted">
            <p>No projects found.</p>
            <p class="text-sm">Create projects to group your tasks.</p>
        </div>

        <div 
            v-for="project in projectStore.projects" 
            :key="project.id"
            class="flex flex-col group bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border hover:border-pomodo-orange transition-all cursor-pointer overflow-hidden"
        >
            <div class="p-4 flex items-center gap-4" @click="openEdit(project)">
                <div @click.stop="toggleExpand(project.id)" class="p-1 hover:bg-light-border dark:hover:bg-dark-border rounded-lg transition-colors">
                    <ChevronDown v-if="expandedProjects.has(project.id)" :size="20" />
                    <ChevronRight v-else :size="20" />
                </div>

                <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="`bg-${project.color || 'pomodo-orange'}/10 text-${project.color || 'pomodo-orange'}`">
                    <Briefcase :size="20" />
                </div>

                <div class="flex-1 min-w-0">
                    <h3 class="font-semibold truncate">{{ project.name }}</h3>
                    <p class="text-xs text-text-muted mt-0.5 truncate" v-if="project.description">
                        {{ project.description }}
                    </p>
                    <div class="flex items-center gap-3 mt-1 text-[10px] uppercase tracking-wider font-bold">
                        <span class="text-pomodo-orange">{{ project.estimated_pomodoros }} Pomodoros</span>
                    </div>
                </div>

                <div class="flex items-center gap-1">
                    <v-btn icon variant="text" size="small" @click.stop="openAddTask(project.id)" color="pomodo-orange" data-testid="add-task-to-project-btn">
                        <Plus :size="20" />
                    </v-btn>
                    <v-btn icon variant="text" size="small" @click.stop="deleteProject(project.id)" color="error">
                        <Trash2 :size="18" />
                    </v-btn>
                </div>
            </div>

            <!-- Tasks List (Expanded) -->
            <v-expand-transition>
                <div v-if="expandedProjects.has(project.id)" class="border-t border-light-border dark:border-dark-border bg-light-bg/30 dark:bg-black/10">
                    <div v-if="getProjectTasks(project.id).length === 0" class="p-4 text-center text-sm text-text-muted italic">
                        No tasks in this project.
                    </div>
                    <div class="divide-y divide-light-border dark:divide-dark-border">
                        <div 
                            v-for="task in getProjectTasks(project.id)" 
                            :key="task.id"
                            class="flex items-center gap-3 p-3 pl-8 hover:bg-light-surface/50 dark:hover:bg-dark-surface/50 transition-colors"
                            @click.stop="openTaskDetails(task)"
                        >
                            <div 
                                @click.stop="handleTaskComplete(task)"
                                class="w-5 h-5 rounded-full border-2 border-text-muted flex items-center justify-center cursor-pointer hover:border-pomodo-orange hover:text-pomodo-orange transition-colors shrink-0"
                                :class="{'bg-pomodo-orange border-pomodo-orange text-white': task.completed}"
                            >
                                <Check v-if="task.completed" :size="12" stroke-width="3" />
                            </div>
                            <span class="text-sm font-medium flex-1 truncate" :class="{'line-through text-text-muted': task.completed}">
                                {{ task.title }}
                            </span>
                            <span class="text-[10px] text-text-muted">{{ task.completedCycles }}/{{ task.cycles }}</span>
                        </div>
                    </div>
                </div>
            </v-expand-transition>
        </div>

    </div>

    <!-- Modals -->
    <CreateTaskModal 
        v-if="showCreateTaskModal && selectedProjectIdForTask"
        :initialProjectId="selectedProjectIdForTask"
        @close="() => { showCreateTaskModal = false; selectedProjectIdForTask = null; }"
    />

    <TaskDetailsModal
        v-if="showDetailsModal && selectedTask"
        :selTask="selectedTask"
        @close="() => { showDetailsModal = false; selectedTask = null; }"
    />

    <!-- Edit Modal -->
    <v-dialog v-model="showEditModal" max-width="500">
        <v-card v-if="editingProject" class="rounded-2xl">
            <v-card-title class="pa-6 pb-0 font-bold text-2xl">
                {{ editingProject.id === 0 ? 'New Project' : 'Edit Project' }}
            </v-card-title>
            
            <v-card-text class="pa-6 pt-4 space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider mb-2">
                    Project Name *
                  </label>
                  <v-text-field
                      v-model="editingProject.name"
                      placeholder="Enter project name"
                      hide-details
                  ></v-text-field>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <v-textarea
                      v-model="editingProject.description"
                      placeholder="Brief description of the project"
                      rows="2"
                      auto-grow
                      hide-details
                  ></v-textarea>
                </div>

                <div class="flex gap-4">
                  <div class="flex-1">
                    <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider mb-2">
                      Est. Pomodoros
                    </label>
                    <v-text-field
                          v-model.number="editingProject.estimated_pomodoros"
                          type="number"
                          hide-details
                          min="1"
                      ></v-text-field>
                  </div>
                  
                  <div class="flex-1">
                    <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider mb-2">
                      Category
                    </label>
                    <v-select
                        v-model="editingProject.category_id"
                        :items="categoryStore.categories"
                        item-title="name"
                        item-value="id"
                        clearable
                        hide-details
                    ></v-select>
                  </div>
                </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-6">
                <v-btn variant="text" @click="showEditModal = false">Cancel</v-btn>
                <v-spacer></v-spacer>
                <v-btn 
                    color="pomodo-orange" 
                    variant="flat" 
                    class="px-8 rounded-lg"
                    @click="saveProject"
                    :disabled="!editingProject.name"
                >
                    Save
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

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
