import { defineStore } from "pinia";
import { ref } from "vue";

export const useUIStore = defineStore("ui", () => {
	const errorMessage = ref<string | null>(null);
	const successMessage = ref<string | null>(null);
	const isMiniMode = ref(false);

	function setError(message: string) {
		errorMessage.value = message;
		setTimeout(() => {
			errorMessage.value = null;
		}, 3000);
	}

	function showSuccess(message: string) {
		successMessage.value = message;
		setTimeout(() => {
			successMessage.value = null;
		}, 3000);
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

	const isMobile = ref(false);

	// Initialize and set up reactivity for mobile detection
	if (typeof window !== "undefined") {
		const userAgent =
			navigator.userAgent ||
			navigator.vendor ||
			("opera" in window ? (window as Window & { opera: string }).opera : "");

		// Check for common mobile devices
		const isNativeMobile =
			/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
				userAgent.toLowerCase()
			);

		const updateMobileStatus = () => {
			// Also check for touch-only devices which usually indicates mobile/tablet
			const isTouchOnly = window.matchMedia("(pointer: coarse)").matches;
			isMobile.value = isNativeMobile || isTouchOnly;
		};

		// Set initial value
		updateMobileStatus();

		// Listen for changes to the media query
		const mediaQuery = window.matchMedia("(pointer: coarse)");
		mediaQuery.addEventListener("change", updateMobileStatus);
	}

	return {
		errorMessage,
		isMobile,
		successMessage,
		isMiniMode,
		setError,
		showSuccess,
		clearError,
		toggleMiniMode,
		setMiniMode
	};
});
