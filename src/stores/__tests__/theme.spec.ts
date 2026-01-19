import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useThemeStore } from "../theme";

describe("Theme Store", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	describe("Initialization", () => {
		it("should expose category colors", () => {
			const themeStore = useThemeStore();
			expect(themeStore.categoryColors).toHaveLength(16);
			expect(themeStore.categoryColors[0]).toBe("#b8744f");
		});

		it("should expose colors object", () => {
			const themeStore = useThemeStore();
			expect(themeStore.colors).toBeDefined();
			expect(themeStore.colors.brand).toBeDefined();
			expect(themeStore.colors.dark).toBeDefined();
			expect(themeStore.colors.text).toBeDefined();
		});
	});

	describe("Color Retrieval", () => {
		it("should get brand colors by path", () => {
			const themeStore = useThemeStore();
			expect(themeStore.getColor("brand.orange")).toBe("#b8744f");
			expect(themeStore.getColor("brand.red")).toBe("#c75450");
			expect(themeStore.getColor("brand.gold")).toBe("#d4a373");
		});

		it("should get dark theme colors by path", () => {
			const themeStore = useThemeStore();
			expect(themeStore.getColor("dark.bg")).toBe("#1a1a1a");
			expect(themeStore.getColor("dark.surface")).toBe("#2a2a3a");
		});

		it("should get text colors by path", () => {
			const themeStore = useThemeStore();
			expect(themeStore.getColor("text.primary")).toBe("#ffffff");
			expect(themeStore.getColor("text.secondary")).toBe("#888888");
		});

		it("should return fallback for invalid path", () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			vi.spyOn(console, "warn").mockImplementation(() => {});
			const themeStore = useThemeStore();
			expect(themeStore.getColor("invalid.path")).toBe("#888888");
		});
	});

	describe("hexToRgba", () => {
		it("should convert hex to rgba correctly", () => {
			const themeStore = useThemeStore();
			expect(themeStore.hexToRgba("#b8744f", 1)).toBe("rgba(184, 116, 79, 1)");
			expect(themeStore.hexToRgba("#b8744f", 0.5)).toBe(
				"rgba(184, 116, 79, 0.5)"
			);
			expect(themeStore.hexToRgba("#b8744f", 0)).toBe("rgba(184, 116, 79, 0)");
		});

		it("should handle hex values without #", () => {
			const themeStore = useThemeStore();
			expect(themeStore.hexToRgba("b8744f", 0.15)).toBe(
				"rgba(184, 116, 79, 0.15)"
			);
		});

		it("should convert white color correctly", () => {
			const themeStore = useThemeStore();
			expect(themeStore.hexToRgba("#ffffff", 1)).toBe("rgba(255, 255, 255, 1)");
		});

		it("should convert black color correctly", () => {
			const themeStore = useThemeStore();
			expect(themeStore.hexToRgba("#0a0a0a", 0.8)).toBe(
				"rgba(10, 10, 10, 0.8)"
			);
		});
	});

	describe("getCategoryColor", () => {
		it("should return category color by index", () => {
			const themeStore = useThemeStore();
			expect(themeStore.getCategoryColor(0)).toBe("#b8744f");
			expect(themeStore.getCategoryColor(1)).toBe("#c75450");
		});

		it("should wrap around for large indices", () => {
			const themeStore = useThemeStore();
			const totalColors = themeStore.categoryColors.length;
			expect(themeStore.getCategoryColor(totalColors)).toBe(
				themeStore.getCategoryColor(0)
			);
			expect(themeStore.getCategoryColor(totalColors + 1)).toBe(
				themeStore.getCategoryColor(1)
			);
		});
	});

	describe("getGradient", () => {
		it("should return gradient definitions", () => {
			const themeStore = useThemeStore();
			expect(themeStore.getGradient("primary")).toContain("#b8744f");
			expect(themeStore.getGradient("success")).toContain("#43A047");
		});

		it("should return primary gradient for invalid names", () => {
			const themeStore = useThemeStore();
			const invalidGradient = themeStore.getGradient(
				"invalid" as keyof typeof themeStore.gradients
			);
			expect(invalidGradient).toBe(themeStore.getGradient("primary"));
		});
	});

	describe("resolveColor", () => {
		it("should return hex colors unchanged", () => {
			const themeStore = useThemeStore();
			expect(themeStore.resolveColor("#b8744f")).toBe("#b8744f");
			expect(themeStore.resolveColor("#ffffff")).toBe("#ffffff");
		});

		it("should resolve legacy color names", () => {
			const themeStore = useThemeStore();
			expect(themeStore.resolveColor("orange")).toBe("#b8744f");
			expect(themeStore.resolveColor("red")).toBe("#c75450");
			expect(themeStore.resolveColor("pomodo-orange")).toBe("#b8744f");
		});

		it("should return fallback for unknown color names", () => {
			vi.spyOn(console, "error").mockImplementation(() => {});
			vi.spyOn(console, "warn").mockImplementation(() => {});
			const themeStore = useThemeStore();
			expect(themeStore.resolveColor("unknown-color")).toBe("#888888");
		});
	});
});
