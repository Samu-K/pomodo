<script setup lang="ts">
defineProps<{
	title: string;
	description?: string;
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center p-8 text-center animate-fade-in h-[60vh]">
    <h3 class="text-2xl font-bold text-lightText-primary dark:text-white mb-2">
      {{ title }}
    </h3>
    <p v-if="description" class="text-lightText-muted dark:text-text-muted max-w-[300px]">
      {{ description }}
    </p>
    
    <!-- Action Slot (Optional) -->
    <div class="mt-8">
      <slot name="action"></slot>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
