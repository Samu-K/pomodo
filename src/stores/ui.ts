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

	return {
		errorMessage,
		successMessage,
		isMiniMode,
		setError,
		showSuccess,
		clearError,
		toggleMiniMode,
		setMiniMode
	};
});
