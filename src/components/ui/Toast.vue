<script setup lang="ts">
import { AlertCircle, CheckCircle, X } from "lucide-vue-next";
import { useUIStore } from "../../stores/ui";

const ui = useUIStore();
</script>

<template>
  <div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
    <TransitionGroup name="toast">
      <!-- Success Toast -->
      <div 
        v-if="ui.successMessage" 
        key="success"
        class="flex items-center gap-3 px-6 py-4 bg-light-surface dark:bg-[#2a2a3a] border border-pomodo-green/20 dark:border-pomodo-green/30 rounded-2xl shadow-2xl pointer-events-auto min-w-[300px]"
      >
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-pomodo-green/10 text-pomodo-green">
            <CheckCircle :size="18" stroke-width="3" />
        </div>
        <p class="text-sm font-bold text-lightText-primary dark:text-text-primary flex-1">
            {{ ui.successMessage }}
        </p>
        <button @click="ui.successMessage = null" class="text-text-muted hover:text-lightText-primary dark:hover:text-white transition-colors">
            <X :size="16" />
        </button>
      </div>

      <!-- Error Toast -->
      <div 
        v-if="ui.errorMessage" 
        key="error"
        class="flex items-center gap-3 px-6 py-4 bg-light-surface dark:bg-[#2a2a3a] border border-pomodo-red/20 dark:border-pomodo-red/30 rounded-2xl shadow-2xl pointer-events-auto min-w-[300px]"
      >
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-pomodo-red/10 text-pomodo-red">
            <AlertCircle :size="18" stroke-width="3" />
        </div>
        <p class="text-sm font-bold text-lightText-primary dark:text-text-primary flex-1">
            {{ ui.errorMessage }}
        </p>
        <button @click="ui.errorMessage = null" class="text-text-muted hover:text-lightText-primary dark:hover:text-white transition-colors">
            <X :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.bg-pomodo-green\/10 { background-color: rgba(34, 197, 94, 0.1); }
.text-pomodo-green { color: #22c55e; }
.border-pomodo-green\/20 { border-color: rgba(34, 197, 94, 0.2); }
.border-pomodo-green\/30 { border-color: rgba(34, 197, 94, 0.3); }

.bg-pomodo-red\/10 { background-color: rgba(239, 68, 68, 0.1); }
.text-pomodo-red { color: #ef4444; }
.border-pomodo-red\/20 { border-color: rgba(239, 68, 68, 0.2); }
.border-pomodo-red\/30 { border-color: rgba(239, 68, 68, 0.3); }
</style>
