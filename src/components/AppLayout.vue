<script setup lang="ts">
import {
	BarChart3,
	Calendar,
	ChevronLeft,
	ListTodo,
	Timer
} from "lucide-vue-next";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Task } from "../defines/task.ts";

interface Props {
	showHeader?: boolean;
	headerTitle?: string;
	showBackButton?: boolean;
	showSettingsButton?: boolean;
	hideBottomNav?: boolean;
}

withDefaults(defineProps<Props>(), {
	showHeader: true,
	headerTitle: "Pomodo",
	showBackButton: false,
	showSettingsButton: true,
	hideBottomNav: false
});

const emit = defineEmits<{
	"back-click": [];
	"add-task": [];
	"task-details": [task: Task];
}>();

const route = useRoute();
const router = useRouter();

const activeTab = computed(() => {
	if (route.path === "/") return "timer";
	if (route.path.startsWith("/timeline")) return "timeline";
	if (route.path.startsWith("/tasks")) return "tasks";
	if (route.path.startsWith("/stats")) return "stats";
	return "";
});

const navigateTo = (path: string) => {
	router.push(path);
};
</script>

<template>
  <div class="flex flex-col h-screen bg-light-bg dark:bg-dark-bg">
    <!-- Header -->
    <header v-if="showBackButton" class="h-12 flex items-center justify-center relative px-6 border-light-border dark:border-dark-border">
      <button 
        v-if="showBackButton"
        @click="emit('back-click')"
        class="absolute left-4 w-10 h-10 flex items-center justify-center text-pomodo-orange hover:bg-light-surface dark:hover:bg-dark-surface rounded-lg transition-colors"
      >
        <ChevronLeft :size="28" />
      </button>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
      <router-view 
        @add-task="emit('add-task')"
        @task-details="(task: Task) => emit('task-details', task)"
      />
    </main>

    <!-- Bottom Navigation -->
    <nav v-if="!hideBottomNav" class="h-20 bg-light-pure dark:bg-dark-pure border-t border-light-border dark:border-dark-border">
      <div class="h-full flex items-center justify-around px-4">
        <button 
          @click="navigateTo('/')"
          :class="[
            'flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors',
            activeTab === 'timer' ? 'text-pomodo-orange' : 'text-lightText-muted dark:text-text-muted hover:text-lightText-secondary dark:hover:text-text-secondary'
          ]"
        >
          <Timer :size="24" />
          <span class="text-xs font-medium">Timer</span>
        </button>
        
        <button 
          @click="navigateTo('/timeline')"
          :class="[
            'flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors',
            activeTab === 'timeline' ? 'text-pomodo-orange' : 'text-lightText-muted dark:text-text-muted hover:text-lightText-secondary dark:hover:text-text-secondary'
          ]"
        >
          <Calendar :size="24" />
          <span class="text-xs font-medium">Timeline</span>
        </button>
        
        <button 
          @click="navigateTo('/tasks')"
          :class="[
            'flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors',
            activeTab === 'tasks' ? 'text-pomodo-orange' : 'text-lightText-muted dark:text-text-muted hover:text-lightText-secondary dark:hover:text-text-secondary'
          ]"
        >
          <ListTodo :size="24" />
          <span class="text-xs font-medium">Tasks</span>
        </button>
        
        <button 
          @click="navigateTo('/stats')"
          :class="[
            'flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors',
            activeTab === 'stats' ? 'text-pomodo-orange' : 'text-lightText-muted dark:text-text-muted hover:text-lightText-secondary dark:hover:text-text-secondary'
          ]"
        >
          <BarChart3 :size="24" />
          <span class="text-xs font-medium">Stats</span>
        </button>
      </div>
    </nav>
  </div>
</template>
