<script setup lang="ts">
import { X } from "lucide-vue-next";

const emit = defineEmits<{
	(e: "save"): void;
	(e: "discard"): void;
	(e: "cancel"): void;
}>();
</script>

<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
    <div class="bg-light-bg dark:bg-dark-bg rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in border border-light-border dark:border-dark-border">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-pomodo-orange">Unsaved Changes</h2>
        <button 
          @click="emit('cancel')"
          class="w-8 h-8 flex items-center justify-center text-lightText-muted dark:text-text-muted hover:text-lightText-primary dark:hover:text-white transition-colors"
        >
          <X :size="20" />
        </button>
      </div>

      <div class="mb-8 text-lightText-secondary dark:text-text-secondary">
        You have unsaved changes. Do you want to save them before leaving?
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button 
          @click="emit('discard')"
          class="flex-1 py-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg text-lightText-secondary dark:text-text-secondary font-semibold hover:bg-light-border dark:hover:bg-dark-border transition-colors"
        >
          Discard Changes
        </button>
        <button 
          @click="emit('save')"
          class="flex-1 py-3 bg-gradient-to-r from-pomodo-orange to-pomodo-red rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Save Changes
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
