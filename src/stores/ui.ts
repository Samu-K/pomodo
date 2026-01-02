import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useUIStore = defineStore("ui", () => {
	const errorMessage = ref<string | null>(null);
	const isMiniMode = ref(false);

	function setError(message: string) {
		errorMessage.value = message;
	}

	function clearError() {
		errorMessage.value = null;
	}

	function toggleMiniMode() {
		isMiniMode.value = !isMiniMode.value;
	}

	function setMiniMode(value: boolean) {
		isMiniMode.value = value;
	}

	const isMobile = computed(() => {
		if (typeof window === "undefined") return false;

		const userAgent =
			navigator.userAgent || navigator.vendor || (window as any).opera;

		// Check for common mobile devices
		const isNativeMobile =
			/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
				userAgent.toLowerCase()
			);

		// Also check for touch-only devices which usually indicates mobile/tablet
		const isTouchOnly = window.matchMedia("(pointer: coarse)").matches;

		return isNativeMobile || isTouchOnly;
	});

	return {
		errorMessage,
		isMobile,
		isMiniMode,
		setError,
		clearError,
		toggleMiniMode,
		setMiniMode
	};
});
