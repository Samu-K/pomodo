import { defineStore } from "pinia";
import { ref } from "vue";

export const useThemeStore = defineStore("theme", () => {
	const theme = ref<"light" | "dark">("dark");

	const categoryColors = ref([
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
	]);

	function toggleTheme() {
		theme.value = theme.value === "light" ? "dark" : "light";
	}

	function setTheme(newTheme: "light" | "dark") {
		theme.value = newTheme;
	}

	return {
		theme,
		categoryColors,
		toggleTheme,
		setTheme
	};
});
