<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";
import { onMounted, onUnmounted, ref, watch } from "vue";

const props = defineProps<{
	scrollContainer: HTMLElement | null;
}>();

const isVisible = ref(false);
const THRESHOLD = 50; // pixels from bottom before hiding

const checkScrollPosition = () => {
	const container = props.scrollContainer;
	if (!container) return;

	const { scrollTop, scrollHeight, clientHeight } = container;
	const isAtBottom = scrollHeight - scrollTop - clientHeight < THRESHOLD;

	isVisible.value = !isAtBottom && scrollHeight > clientHeight;
};

const scrollToBottom = () => {
	const container = props.scrollContainer;
	if (!container) return;

	container.scrollTo({
		top: container.scrollHeight,
		behavior: "smooth"
	});
};

watch(
	() => props.scrollContainer,
	(newContainer, oldContainer) => {
		if (oldContainer) {
			oldContainer.removeEventListener("scroll", checkScrollPosition);
		}
		if (newContainer) {
			newContainer.addEventListener("scroll", checkScrollPosition);
			// Check immediately
			checkScrollPosition();
		}
	},
	{ immediate: true }
);

onMounted(() => {
	// Use ResizeObserver to detect content changes
	if (props.scrollContainer) {
		checkScrollPosition();
	}
});

onUnmounted(() => {
	if (props.scrollContainer) {
		props.scrollContainer.removeEventListener("scroll", checkScrollPosition);
	}
});
</script>

<template>
  <Transition name="fade">
    <button
      v-if="isVisible"
      @click="scrollToBottom"
      class="scroll-indicator"
      aria-label="Scroll to bottom"
    >
      <ChevronDown :size="20" />
    </button>
  </Transition>
</template>

<style scoped>
.scroll-indicator {
  position: sticky;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 36px;
  margin: 0 auto;
  border-radius: 50%;
  background: white;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  z-index: 10;
}

.scroll-indicator:hover {
  transform: translateX(-50%) scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.scroll-indicator:active {
  transform: translateX(-50%) scale(0.95);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
