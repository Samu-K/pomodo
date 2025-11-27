import { defineStore } from "pinia";
import { ref } from "vue";
import type { Category } from "../funcs/commands";
import {
	add_category,
	change_category_name_array,
	delete_category_array,
	get_categories
} from "../funcs/db/categories";

export const useCategoryStore = defineStore("categories", () => {
	const categories = ref<Category[]>([]);
	const isLoading = ref(false);

	const fetchCategories = async () => {
		isLoading.value = true;
		try {
			const fetched = await get_categories();
			categories.value = fetched;
		} finally {
			isLoading.value = false;
		}
	};

	const createCategory = async (cat: Category) => {
		await add_category(cat);
		await fetchCategories();
	};

	const updateCategories = async (cats: Category[]) => {
		await change_category_name_array(cats);
		await fetchCategories();
	};

	const removeCategories = async (cats: Category[]) => {
		await delete_category_array(cats);
		await fetchCategories();
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
