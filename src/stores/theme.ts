import { defineStore } from "pinia";
import { computed } from "vue";
import {
	legacyColorMap,
	themeColors,
	themeGradients
} from "../defines/theme.config";

export const useThemeStore = defineStore("theme", () => {
	// Expose all theme colors as computed refs for reactivity
	const colors = computed(() => themeColors);
	const gradients = computed(() => themeGradients);

	// Keep categoryColors for backward compatibility
	const categoryColors = computed(() => themeColors.category);

	/**
	 * Get a color value by dot-notation path
	 * @example getColor('brand.orange') // returns '#b8744f'
	 * @example getColor('dark.bg') // returns '#1a1a1a'
	 */
	function getColor(path: string): string {
		const parts = path.split(".");
		let value: Record<string, unknown> | string = themeColors;

		for (const part of parts) {
			if (typeof value === "object" && value && part in value) {
				value = value[part] as Record<string, unknown> | string;
			} else {
				console.warn(`Color path '${path}' not found in theme`);
				return "#888888"; // Fallback to gray
			}
		}

		return typeof value === "string" ? value : "#888888";
	}

	/**
	 * Convert hex color to rgba
	 * @param hex - Hex color code (e.g., '#b8744f')
	 * @param alpha - Alpha value (0-1)
	 * @returns rgba string (e.g., 'rgba(184, 116, 79, 0.15)')
	 */
	function hexToRgba(hex: string, alpha: number): string {
		// Remove # if present
		const cleanHex = hex.replace("#", "");

		// Parse RGB values
		const r = parseInt(cleanHex.slice(0, 2), 16);
		const g = parseInt(cleanHex.slice(2, 4), 16);
		const b = parseInt(cleanHex.slice(4, 6), 16);

		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	/**
	 * Get category color by index (wraps around)
	 * @param index - Category index
	 * @returns Hex color code
	 */
	function getCategoryColor(index: number): string {
		const colors = themeColors.category;
		return colors[index % colors.length];
	}

	/**
	 * Get gradient definition by name
	 * @param name - Gradient name (e.g., 'primary', 'success')
	 * @returns CSS gradient string
	 */
	function getGradient(name: keyof typeof themeGradients): string {
		return themeGradients[name] || themeGradients.primary;
	}

	/**
	 * Resolve color from legacy color names or hex values
	 * @param color - Color name or hex value
	 * @returns Hex color code
	 */
	function resolveColor(color: string): string {
		// If it's already a hex color, return it
		if (color.startsWith("#")) {
			return color;
		}

		// Check legacy color map
		if (color in legacyColorMap) {
			return legacyColorMap[color];
		}

		// Fallback
		console.warn(`Unable to resolve color: ${color}`);
		return themeColors.text.secondary;
	}

	return {
		// Computed colors
		colors,
		gradients,
		categoryColors,

		// Utility functions
		getColor,
		hexToRgba,
		getCategoryColor,
		getGradient,
		resolveColor
	};
});
