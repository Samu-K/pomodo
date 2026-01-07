import { defineStore } from "pinia";
import { ref } from "vue";
import type { Category } from "../funcs/commands";
import {
	add_category,
	change_category_name_array,
	delete_category_array,
	get_categories
} from "../funcs/db/categories";
import { useUIStore } from "./ui";

export const useCategoryStore = defineStore("categories", () => {
	const ui = useUIStore();
	const categories = ref<Category[]>([]);
	const isLoading = ref(false);

	const fetchCategories = async () => {
		isLoading.value = true;
		try {
			const fetched = await get_categories();
			categories.value = fetched;
		} catch (e) {
			console.error("Failed to fetch categories", e);
			let msg = "Failed to fetch categories";
			if (e instanceof Error) msg = e.message;
			ui.setError(msg);
		} finally {
			isLoading.value = false;
		}
	};

	const createCategory = async (cat: Category) => {
		try {
			await add_category(cat);
			await fetchCategories();
		} catch (e) {
			console.error("Failed to create category", e);
			let msg = "Failed to create category";
			if (e instanceof Error) msg = e.message;
			ui.setError(msg);
		}
	};

	const updateCategories = async (cats: Category[]) => {
		try {
			await change_category_name_array(cats);
			await fetchCategories();
		} catch (e) {
			console.error("Failed to update categories", e);
			let msg = "Failed to update categories";
			if (e instanceof Error) msg = e.message;
			ui.setError(msg);
		}
	};

	const removeCategories = async (cats: Category[]) => {
		try {
			await delete_category_array(cats);
			await fetchCategories();
		} catch (e) {
			console.error("Failed to remove categories", e);
			let msg = "Failed to remove categories";
			if (e instanceof Error) msg = e.message;
			ui.setError(msg);
		}
	};

	return {
		categories,
		isLoading,
		fetchCategories,
		createCategory,
		updateCategories,
		removeCategories
	};
});
