import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCategoryStore } from "../categories";

// Mock DB functions
vi.mock("../../funcs/db/categories", () => ({
	add_category: vi.fn(),
	change_category_name_array: vi.fn(),
	delete_category_array: vi.fn(),
	get_categories: vi.fn()
}));

import {
	add_category,
	change_category_name_array,
	delete_category_array,
	get_categories
} from "../../funcs/db/categories";

describe("Category Store", () => {
	let categoryStore: ReturnType<typeof useCategoryStore>;

	beforeEach(() => {
		setActivePinia(createPinia());
		categoryStore = useCategoryStore();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Initialization", () => {
		it("initializes with default state", () => {
			expect(categoryStore.categories).toEqual([]);
			expect(categoryStore.isLoading).toBe(false);
		});
	});

	describe("Actions", () => {
		it("fetchCategories fetches and updates categories", async () => {
			const mockCategories = [
				{ id: 1, name: "Work", color: "red" },
				{ id: 2, name: "Study", color: "blue" }
			];
			vi.mocked(get_categories).mockResolvedValue(mockCategories);

			await categoryStore.fetchCategories();

			expect(get_categories).toHaveBeenCalled();
			expect(categoryStore.categories).toEqual(mockCategories);
			expect(categoryStore.isLoading).toBe(false);
		});

		it("fetchCategories handles errors", async () => {
			vi.mocked(get_categories).mockRejectedValue(new Error("DB Error"));

			await expect(categoryStore.fetchCategories()).rejects.toThrow("DB Error");
			expect(categoryStore.isLoading).toBe(false);
		});

		it("createCategory adds a category and refreshes", async () => {
			const newCategory = { id: 0, name: "New", color: "green" };
			vi.mocked(add_category).mockResolvedValue(1);
			vi.mocked(get_categories).mockResolvedValue([
				{ id: 1, name: "New", color: "green" }
			]);

			await categoryStore.createCategory(newCategory);

			expect(add_category).toHaveBeenCalledWith(newCategory);
			expect(get_categories).toHaveBeenCalled();
			expect(categoryStore.categories).toHaveLength(1);
		});

		it("updateCategories updates categories and refreshes", async () => {
			const catsToUpdate = [{ id: 1, name: "Updated", color: "red" }];
			vi.mocked(change_category_name_array).mockResolvedValue(undefined);
			vi.mocked(get_categories).mockResolvedValue(catsToUpdate);

			await categoryStore.updateCategories(catsToUpdate);

			expect(change_category_name_array).toHaveBeenCalledWith(catsToUpdate);
			expect(get_categories).toHaveBeenCalled();
			expect(categoryStore.categories).toEqual(catsToUpdate);
		});

		it("removeCategories deletes categories and refreshes", async () => {
			const catsToDelete = [{ id: 1, name: "Delete", color: "red" }];
			vi.mocked(delete_category_array).mockResolvedValue(undefined);
			vi.mocked(get_categories).mockResolvedValue([]);

			await categoryStore.removeCategories(catsToDelete);

			expect(delete_category_array).toHaveBeenCalledWith(catsToDelete);
			expect(get_categories).toHaveBeenCalled();
			expect(categoryStore.categories).toEqual([]);
		});
	});
});
