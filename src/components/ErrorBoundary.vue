<template>
  <slot v-if="!hasError"></slot>
  
  <div v-else class="error-fallback">
  </div>
</template>

<script setup lang="ts">
import { onErrorCaptured, ref } from "vue";

const hasError = ref(false);

// This hook captures errors from any *descendant* component
onErrorCaptured((err, _instance, _info) => {
	console.error("Captured Error:", err);

	// 1. Mark this specific instance as having an error
	hasError.value = true;

	// 2. Return false to STOP the error from bubbling up to global handlers
	// If you don't return false, the app might still crash or log globally
	return false;
});
</script>
