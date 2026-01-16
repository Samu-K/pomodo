<script setup lang="ts">
import { Calendar, ChevronLeft, ChevronRight } from "lucide-vue-next";

defineProps<{
	selectedDate: Date;
	viewMode: "timeline" | "calendar";
	isDateToday: boolean;
}>();

const emit = defineEmits<{
	(e: "prev"): void;
	(e: "next"): void;
	(e: "today"): void;
	(e: "update:viewMode", value: "timeline" | "calendar"): void;
}>();
</script>

<template>
  <div class="px-6 py-4 border-b border-light-border dark:border-dark-border mb-2 ">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button 
          data-testid="prev-date"
          class="w-8 h-8 rounded-full border border-pomodo-orange text-pomodo-orange hover:bg-pomodo-orange hover:text-white transition-colors flex items-center justify-center"
          @click="emit('prev')"
        >
          <ChevronLeft :size="16" />
        </button>
        <span data-testid="selected-date-display" class="mt-3 text-lg font-semibold text-pomodo-orange">
          <div class="flex">
            <p v-if="viewMode === 'timeline'">
              <span v-if="isDateToday">Today</span>
              <span v-else>{{ selectedDate.toLocaleString('default', { day: 'numeric', month: 'short' }) }}</span>
            </p>
            <p v-else>
              {{ selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' }) }}
            </p>
          </div>
        </span>
        <button 
          data-testid="next-date"
          class="w-8 h-8 rounded-full border border-pomodo-orange text-pomodo-orange hover:bg-pomodo-orange hover:text-white transition-colors flex items-center justify-center"
          @click="emit('next')"
        >
          <ChevronRight :size="16" />
        </button>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Calendar Toggle -->
        <button 
          class="mt-3 mr-2 text-pomodo-orange hover:text-pomodo-gold transition-colors"
          @click="emit('update:viewMode', viewMode === 'timeline' ? 'calendar' : 'timeline')"
          :title="viewMode === 'timeline' ? 'Switch to Calendar' : 'Switch to Timeline'"
        >
          <Calendar :size="20" />
        </button>

        <button class="mt-3 text-pomodo-orange hover:text-pomodo-gold transition-colors"
          @click="emit('today')"
        >
          <span class="text-sm">Today</span>
        </button>
      </div>
    </div>
  </div>
</template>
