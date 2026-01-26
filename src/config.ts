import { ref } from "vue";

/**
 * Global App Configuration
 */
declare global {
	interface Window {
		_isTest?: boolean;
		__POMODO_TOGGLE_PREMIUM_FEATURES?: (val: boolean) => void;
	}
}

const win = typeof window !== "undefined" ? window : null;

// Default to false for dev, but allow override for tests
const isTest = win?._isTest === true;
const _showPremiumFeatures = ref(isTest);

export const SHOW_PREMIUM_FEATURES = _showPremiumFeatures;

if (win) {
	win.__POMODO_TOGGLE_PREMIUM_FEATURES = (val: boolean) => {
		_showPremiumFeatures.value = val;
	};
}
