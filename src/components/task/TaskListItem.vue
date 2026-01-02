<script setup lang="ts">
import { Check, Calendar, MoreVertical } from "lucide-vue-next";
import type { Task } from "../../defines/task";
import { useTasks } from "../../stores/task";

const props = defineProps<{
	task: Task;
}>();

const emit = defineEmits<{
	click: [Task];
}>();

const tasksStore = useTasks();

const handleToggle = (e: Event) => {
	e.stopPropagation();
	tasksStore.toggleTaskCompletion(props.task);
};
</script>

<template>
  <div 
    class="group relative bg-light-surface dark:bg-dark-surface rounded-2xl p-4 border border-light-border dark:border-dark-border hover:border-pomodo-orange/50 hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
    @click="emit('click', task)"
  >
    <!-- Category Indicator (Left Border) -->
    <div 
        v-if="task.category_id !== null"
        class="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-pomodo-orange opacity-40 group-hover:opacity-100 transition-opacity"
    ></div>

    <div class="flex items-center gap-4">
        <!-- Polished Checkbox -->
        <button 
            @click.stop="handleToggle"
            class="w-7 h-7 rounded-full border-2 border-text-muted/30 flex items-center justify-center cursor-pointer hover:border-pomodo-orange hover:bg-pomodo-orange/5 transition-all shrink-0"
            :class="{'bg-pomodo-orange border-pomodo-orange shadow-lg shadow-pomodo-orange/20 text-white': task.completed}"
            aria-label="Toggle task completion"
        >
            <Check v-if="task.completed" :size="16" stroke-width="4" />
            <div v-else class="w-2 h-2 rounded-full bg-pomodo-orange opacity-0 group-hover:opacity-40 transition-opacity"></div>
        </button>

        <div class="flex-1 min-w-0">
            <h3 
                class="font-bold text-lightText-primary dark:text-text-primary transition-all truncate pr-2" 
                :class="{'line-through text-text-muted opacity-50': task.completed, 'text-lg': !task.completed}"
            >
                {{ task.title }}
            </h3>
            <div class="flex items-center gap-3 text-xs text-text-muted mt-1 font-semibold uppercase tracking-wider">
                <span class="flex items-center gap-1.5 opacity-80">
                    <div class="w-1.5 h-1.5 rounded-full bg-text-muted/40"></div>
                    {{ task.completedCycles }} / {{ task.cycles }} cycles
                </span>
                <span v-if="task.recurrence_rule" class="flex items-center gap-1 text-pomodo-orange/80">
                    <Calendar :size="12" /> Recurring
                </span>
                <span v-if="task.category" class="opacity-60 italic text-2xs truncate">
                    #{{ task.category }}
                </span>
            </div>
        </div>

        <!-- Action Icon -->
        <div class="text-text-muted opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            <MoreVertical :size="18" />
        </div>
    </div>
  </div>
</template>

<style scoped>
.text-2xs {
    font-size: 0.65rem;
}
</style>
