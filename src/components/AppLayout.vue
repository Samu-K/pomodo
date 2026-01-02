<script setup lang="ts">
import {
	BarChart3,
	Briefcase,
	Calendar,
	ChevronLeft,
	ListTodo,
	Timer
} from "lucide-vue-next";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Task } from "../defines/task.ts";

interface Props {
	showHeader?: boolean;
	headerTitle?: string;
	showBackButton?: boolean;
	showSettingsButton?: boolean;
	hideBottomNav?: boolean;
	isMiniMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	showHeader: true,
	headerTitle: "Pomodo",
	showBackButton: false,
	showSettingsButton: true,
	hideBottomNav: false,
	isMiniMode: false
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
	if (route.path.startsWith("/projects")) return "projects";
	if (route.path.startsWith("/tasks")) return "tasks";
	if (route.path.startsWith("/stats")) return "stats";
	return "";
});

const navigateTo = (path: string) => {
	router.push(path);
};

// Swipe Logic
const touchStart = ref({ x: 0, y: 0 });
const minSwipeDistance = 50;
const maxVerticalDistance = 50; // To prevent scrolling from triggering swipe

const handleTouchStart = (e: TouchEvent) => {
	touchStart.value = {
		x: e.changedTouches[0].screenX,
		y: e.changedTouches[0].screenY
	};
};

const handleTouchEnd = (e: TouchEvent) => {
	const touchEnd = {
		x: e.changedTouches[0].screenX,
		y: e.changedTouches[0].screenY
	};

	const xDiff = touchStart.value.x - touchEnd.x;
	const yDiff = touchStart.value.y - touchEnd.y;

	// Check if it's a horizontal swipe and not a vertical scroll
	if (
		Math.abs(xDiff) > minSwipeDistance &&
		Math.abs(yDiff) < maxVerticalDistance
	) {
		if (xDiff > 0) {
			// Swipe Left (Next)
			handleSwipeLeft();
		} else {
			// Swipe Right (Previous/Back)
			handleSwipeRight();
		}
	}
};

const mainTabs = ["/", "/timeline", "/projects", "/tasks", "/stats"];

const handleSwipeLeft = () => {
	// If we are on a sub-page (like settings), do nothing or handle differently?
	// For now, only switch tabs if we are on one of the main tabs
	const currentIndex = mainTabs.indexOf(route.path);
	if (currentIndex !== -1 && currentIndex < mainTabs.length - 1) {
		router.push(mainTabs[currentIndex + 1]);
	}
};

const handleSwipeRight = () => {
	if (props.showBackButton) {
		emit("back-click");
		return;
	}

	const currentIndex = mainTabs.indexOf(route.path);
	if (currentIndex !== -1 && currentIndex > 0) {
		router.push(mainTabs[currentIndex - 1]);
	}
};
</script>

<template>
  <div 
    class="fixed inset-0 flex flex-col w-screen pt-[env(safe-area-inset-top)]"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <!-- Header -->
    <header 
      v-if="showBackButton" 
      class="pt-[env(safe-area-inset-top)] min-h-12 flex items-center justify-center relative px-6 border-light-border dark:border-dark-border"
    >
      <button 
        v-if="showBackButton"
        @click="emit('back-click')"
        class="absolute bottom-1 left-4 w-10 h-10 flex items-center justify-center text-pomodo-orange hover:bg-light-surface dark:hover:bg-dark-surface rounded-lg transition-colors"
      >
        <ChevronLeft :size="28" />
      </button>
    </header>

    <!-- Main Content -->
    <main 
      class="flex-1 overflow-hidden pt-0"
      :class="[
        hideBottomNav || isMiniMode ? 'bg-black' : 'bg-light-bg dark:bg-dark-bg',
      ]"
    >
      <router-view 
        @add-task="emit('add-task')"
        @task-details="(task: Task) => emit('task-details', task)"
      />
    </main>

    <!-- Bottom Navigation -->
    <nav v-if="!hideBottomNav && !isMiniMode" class="bg-light-pure dark:bg-dark-pure border-t border-light-border dark:border-dark-border touch-none pb-[env(safe-area-inset-bottom)]">
      <div class="h-16 flex items-center justify-around px-4">
        <button 
          data-testid="nav-timer"
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
          data-testid="nav-timeline"
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
          data-testid="nav-projects"
          @click="navigateTo('/projects')"
          :class="[
            'flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors',
            activeTab === 'projects' ? 'text-pomodo-orange' : 'text-lightText-muted dark:text-text-muted hover:text-lightText-secondary dark:hover:text-text-secondary'
          ]"
        >
          <Briefcase :size="24" />
          <span class="text-xs font-medium">Projects</span>
        </button>
        
        <button 
          data-testid="nav-tasks"
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
          data-testid="nav-stats"
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
