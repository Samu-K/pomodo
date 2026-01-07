<script setup lang="ts">
import { Compass, X } from "lucide-vue-next";

const emit = defineEmits(["close", "createCategories"]);

const handleCreateCategories = () => {
	emit("createCategories");
};
</script>

<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] animate-fade-in backdrop-blur-sm">
    <div class="bg-light-bg dark:bg-dark-bg rounded-3xl p-8 w-full max-w-sm mx-4 animate-scale-in border border-light-border dark:border-dark-border shadow-2xl relative overflow-hidden">
      <div class="absolute -top-24 -right-24 w-48 h-48 bg-pomodo-orange/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-pomodo-red/10 rounded-full blur-3xl"></div>

      <button 
        @click="emit('close')"
        class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-lightText-muted dark:text-text-muted hover:text-lightText-primary dark:hover:text-white transition-colors z-10"
      >
        <X :size="20" />
      </button>

      <div class="relative z-10 flex flex-col items-center text-center">
        <div class="w-16 h-16 bg-gradient-to-br from-pomodo-orange to-pomodo-red rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pomodo-orange/20 rotate-[15deg]">
          <Compass class="text-white" :size="32" />
        </div>

        <h2 class="text-2xl font-bold text-lightText-primary dark:text-white mb-4">
          Welcome to Pomodo
        </h2>

        <p class="text-lightText-secondary dark:text-text-secondary leading-relaxed mb-8">
          Thank you for downloading the app. Get started by creating categories, tasks or projects. Or just focus, whatever floats your boat.
        </p>

        <div class="w-full space-y-3">
          <button 
            @click="handleCreateCategories"
            class="w-full py-4 bg-gradient-to-r from-pomodo-orange to-pomodo-red rounded-xl text-white font-bold hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-pomodo-orange/20"
          >
            Create Categories
          </button>
          
          <button 
            @click="emit('close')"
            class="w-full py-3 text-sm font-medium text-lightText-muted dark:text-text-muted hover:text-lightText-secondary dark:hover:text-text-secondary transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
