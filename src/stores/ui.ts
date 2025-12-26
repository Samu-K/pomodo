import { defineStore } from "pinia";
import { ref } from "vue";

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

    return {
        errorMessage,
        isMiniMode,
        setError,
        clearError,
        toggleMiniMode,
        setMiniMode
    };
});
