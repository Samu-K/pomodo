import { ref } from "vue";

/**
 * Global App Configuration
 */

interface CustomWindow extends Window {
	_isTest?: boolean;
	__POMODO_TOGGLE_PREMIUM_FEATURES?: (val: boolean) => void;
}

const win =
	typeof window !== "undefined" ? (window as unknown as CustomWindow) : null;

// Default to false for dev, but allow override for tests
const isTest = win?._isTest === true;
const _showPremiumFeatures = ref(isTest);

/**
 * If false, all premium features are unlocked and paywalls are hidden.
 * Set to true for production/app store deployments.
 *
 * In E2E tests, this can be toggled via window.__POMODO_TOGGLE_PREMIUM_FEATURES(true/false)
 */
export const SHOW_PREMIUM_FEATURES = _showPremiumFeatures;

if (win) {
	win.__POMODO_TOGGLE_PREMIUM_FEATURES = (val: boolean) => {
		_showPremiumFeatures.value = val;
	};
}
