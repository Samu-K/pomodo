<script setup lang="ts">
import { X } from "lucide-vue-next";

defineProps<{
	title: string;
	message: string;
	primaryBtnText: string;
	secondaryBtnText: string;
	isDanger?: boolean;
}>();

const emit = defineEmits<{
	(e: "primary"): void;
	(e: "secondary"): void;
	(e: "close"): void;
}>();
</script>

<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in" @click.self="emit('close')">
    <div class="bg-light-bg dark:bg-dark-bg rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in border border-light-border dark:border-dark-border shadow-2xl">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold" :class="isDanger ? 'text-red-500' : 'text-pomodo-orange'">{{ title }}</h2>
        <button 
          @click="emit('close')"
          class="w-8 h-8 flex items-center justify-center text-lightText-muted dark:text-text-muted hover:text-lightText-primary dark:hover:text-white transition-colors"
        >
          <X :size="20" />
        </button>
      </div>

      <div class="mb-8 text-lightText-secondary dark:text-text-secondary leading-relaxed">
        {{ message }}
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button 
          data-testid="confirmation-secondary-btn"
          @click="emit('secondary')"
          class="flex-1 py-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg text-lightText-secondary dark:text-text-secondary font-semibold hover:bg-light-border dark:hover:bg-dark-border transition-colors"
        >
          {{ secondaryBtnText }}
        </button>
        <button 
          data-testid="confirmation-primary-btn"
          @click="emit('primary')"
          class="flex-1 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity shadow-lg"
          :class="isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-pomodo-orange to-pomodo-red'"
        >
          {{ primaryBtnText }}
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
    transform: scale(0.95);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out forwards;
}

.animate-scale-in {
  animation: scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
