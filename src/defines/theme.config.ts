/**
 * Central Theme Configuration
 * Single source of truth for all color definitions in the application
 */

export const themeColors = {
	// Brand colors - Pomodo palette
	brand: {
		orange: "#b8744f",
		red: "#c75450",
		gold: "#d4a373",
		brown: "#8b5a3c"
	},

	// Dark theme backgrounds
	dark: {
		bg: "#1a1a1a",
		surface: "#2a2a3a",
		border: "#3a3a4a",
		pure: "#0a0a0a"
	},

	// Light theme backgrounds
	light: {
		bg: "#f5f5f5",
		surface: "#ffffff",
		border: "#e0e0e0",
		pure: "#fafafa"
	},

	// Text colors (dark mode)
	text: {
		primary: "#ffffff",
		secondary: "#888888",
		muted: "#666666"
	},

	// Text colors (light mode)
	lightText: {
		primary: "#1a1a1a",
		secondary: "#666666",
		muted: "#888888"
	},

	// Category colors - Extended palette for user categorization
	category: [
		"#b8744f", // pomodo-orange
		"#c75450", // pomodo-red
		"#d4a373", // pomodo-gold
		"#8b5a3c", // pomodo-brown
		"#E53935", // Red
		"#D81B60", // Pink
		"#8E24AA", // Purple
		"#5E35B1", // Deep Purple
		"#3949AB", // Indigo
		"#1E88E5", // Blue
		"#039BE5", // Light Blue
		"#00ACC1", // Cyan
		"#00897B", // Teal
		"#43A047", // Green
		"#7CB342", // Light Green
		"#FDD835" // Yellow
	],

	// Utility colors
	utility: {
		success: "#43A047",
		successLight: "#4ade80",
		warning: "#FDD835",
		error: "#E53935",
		info: "#1E88E5"
	}
};

// Gradient definitions
export const themeGradients = {
	primary: "linear-gradient(to bottom right, #b8744f, #c75450)",
	success: "linear-gradient(to bottom right, #43A047, #7CB342)",
	gray: "linear-gradient(to bottom right, #666666, #0a0a0a)",
	grayDark: "linear-gradient(to bottom right, #1a1a1a, #0a0a0a)"
};

// Tailwind-compatible color export
export const tailwindColors = {
	pomodo: themeColors.brand,
	dark: themeColors.dark,
	light: themeColors.light,
	text: themeColors.text,
	lightText: themeColors.lightText
};

// Legacy color mappings for backward compatibility
export const legacyColorMap: Record<string, string> = {
	orange: themeColors.brand.orange,
	red: themeColors.brand.red,
	green: themeColors.utility.success,
	purple: "#8E24AA",
	"pomodo-orange": themeColors.brand.orange
};
