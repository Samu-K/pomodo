import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Category } from "../../commands";
import {
	add_category,
	change_category_name,
	change_category_name_array,
	delete_category,
	delete_category_array,
	get_categories
} from "../categories";

// Mock the invoke function from tauri
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn()
}));

describe("Categories DB Functions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("get_categories returns categories when they exist", async () => {
		const mockCategories: Category[] = [
			{ id: 1, name: "Work", color: "red" },
			{ id: 2, name: "Study", color: "blue" }
		];

		vi.mocked(invoke).mockResolvedValue(mockCategories);

		const result = await get_categories();

		expect(invoke).toHaveBeenCalledWith("categories_get_categories");
		expect(result).toEqual(mockCategories);
	});

	it("get_categories returns empty array when no categories found", async () => {
		vi.mocked(invoke).mockResolvedValue([]);

		const result = await get_categories();

		expect(invoke).toHaveBeenCalledWith("categories_get_categories");
		expect(result).toEqual([]);
	});

	it("add_category calls invoke with correct arguments", async () => {
		const mockCategory: Category = {
			id: 0,
			name: "New Category",
			color: "green"
		};
		vi.mocked(invoke).mockResolvedValue(1);

		await add_category(mockCategory);

		expect(invoke).toHaveBeenCalledWith("categories_add_category", {
			cat: mockCategory
		});
	});

	it("delete_category calls invoke with correct arguments", async () => {
		const catId = 1;
		vi.mocked(invoke).mockResolvedValue(undefined);

		await delete_category(catId);

		expect(invoke).toHaveBeenCalledWith("categories_delete_category", {
			catId: catId
		});
	});

	it("change_category_name calls invoke with correct arguments", async () => {
		const catId = 1;
		const newName = "Updated Name";
		vi.mocked(invoke).mockResolvedValue(undefined);

		await change_category_name(catId, newName);

		expect(invoke).toHaveBeenCalledWith("categories_set_category_name", {
			name: newName,
			catId: catId
		});
	});

	it("change_category_name_array calls change_category_name for each category", async () => {
		const categories: Category[] = [
			{ id: 1, name: "Cat 1", color: "red" },
			{ id: 2, name: "Cat 2", color: "blue" }
		];
		vi.mocked(invoke).mockResolvedValue(undefined);

		await change_category_name_array(categories);

		expect(invoke).toHaveBeenCalledTimes(2);
		expect(invoke).toHaveBeenNthCalledWith(1, "categories_set_category_name", {
			name: "Cat 1",
			catId: 1
		});
		expect(invoke).toHaveBeenNthCalledWith(2, "categories_set_category_name", {
			name: "Cat 2",
			catId: 2
		});
	});

	it("delete_category_array calls delete_category for each category", async () => {
		const categories: Category[] = [
			{ id: 1, name: "Cat 1", color: "red" },
			{ id: 2, name: "Cat 2", color: "blue" }
		];
		vi.mocked(invoke).mockResolvedValue(undefined);

		await delete_category_array(categories);

		expect(invoke).toHaveBeenCalledTimes(2);
		expect(invoke).toHaveBeenNthCalledWith(1, "categories_delete_category", {
			catId: 1
		});
		expect(invoke).toHaveBeenNthCalledWith(2, "categories_delete_category", {
			catId: 2
		});
	});
});
