<script setup lang="ts">
import { Check, Minus, Plus, X } from "lucide-vue-next";
import { ref } from "vue";

import { useThemeStore } from "../../stores/theme";

const emit = defineEmits<{
	close: [];
}>();

const themeStore = useThemeStore();

// Form data
const categoryName = ref("");
const selectedColor = ref(themeStore.categoryColors[0]);
const dailyGoal = ref(4);
const trackStatistics = ref(true);

const colorOptions = themeStore.categoryColors;
</script>

<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
    <div class="bg-dark-bg rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in border border-dark-border">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-pomodo-orange">Create New Category</h2>
        <button 
          @click="emit('close')"
          class="w-8 h-8 flex items-center justify-center text-text-muted hover:text-white transition-colors"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Form -->
      <div class="space-y-5">
        <!-- Category Name -->
        <div>
          <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Category Name
          </label>
          <input 
            v-model="categoryName"
            type="text"
            placeholder="Enter category name"
            class="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-text-muted focus:border-pomodo-orange focus:outline-none transition-colors"
          />
        </div>

        <!-- Color Selection -->
        <div>
          <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Color
          </label>
          <div class="grid grid-cols-8 gap-2">
            <button
              v-for="color in colorOptions"
              :key="color"
              @click="selectedColor = color"
              :class="[
                'w-10 h-10 rounded-full transition-all hover:scale-110',
                selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-bg' : ''
              ]"
              :style="`background-color: ${color}`"
            ></button>
          </div>
        </div>

        <!-- Daily Goal -->
        <div>
          <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Daily Goal (Optional)
          </label>
          <div class="flex items-center gap-4 bg-dark-surface rounded-lg px-3 py-2 w-fit">
            <button 
              @click="dailyGoal = Math.max(1, dailyGoal - 1)"
              class="w-8 h-8 flex items-center justify-center text-pomodo-orange hover:bg-dark-border rounded transition-colors"
            >
              <Minus :size="16" />
            </button>
            <span class="text-white min-w-[80px] text-center">{{ dailyGoal }} sessions</span>
            <button 
              @click="dailyGoal++"
              class="w-8 h-8 flex items-center justify-center text-pomodo-orange hover:bg-dark-border rounded transition-colors"
            >
              <Plus :size="16" />
            </button>
          </div>
        </div>

        <!-- Track Statistics -->
        <div class="flex items-center gap-3">
          <button 
            @click="trackStatistics = !trackStatistics"
            class="w-5 h-5 border-2 border-pomodo-orange rounded flex items-center justify-center"
            :class="trackStatistics ? 'bg-pomodo-orange' : ''"
          >
            <Check v-if="trackStatistics" :size="12" class="text-white" />
          </button>
          <label class="text-white cursor-pointer" @click="trackStatistics = !trackStatistics">
            Track statistics for this category
          </label>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 mt-8">
        <button 
          @click="emit('close')"
          class="flex-1 py-3 bg-dark-surface border border-dark-border rounded-lg text-text-secondary font-semibold hover:bg-dark-border transition-colors"
        >
          Cancel
        </button>
        <button class="flex-1 py-3 bg-gradient-to-r from-pomodo-orange to-pomodo-red rounded-lg text-white font-semibold hover:opacity-90 transition-opacity">
          Create Category
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from { 
    opacity: 0;
    transform: scale(0.9);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}
</style>
