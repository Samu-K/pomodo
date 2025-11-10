import { invoke } from "@tauri-apps/api/core";
import type { Category } from "../../defines/category";

const get_categories = async () => {
	const categories = await invoke<Category[]>("categories_get_categories");
	if (categories.length > 0) {
		return categories;
	} else {
		throw Error("Categories empty");
	}
};

const add_category = async (new_category: Category) => {
	const res = await invoke("categories_add_category", { cat: new_category });
	return res;
};

const delete_category = async (category_id: number) => {
	const res = await invoke("categories_delete_category", {
		cat_id: category_id
	});
	return res;
};

const change_category_name = async (category_id: number, new_name: string) => {
	const res = await invoke("categories_set_category_name", {
		name: new_name,
		cat_id: category_id
	});
	return res;
};

const change_category_name_array = async (category_array: Category[]) => {
	for (const category of category_array) {
		await change_category_name(category.id, category.name);
	}
};

const delete_category_array = async (category_array: Category[]) => {
	for (const category of category_array) {
		await delete_category(category.id);
	}
};

export {
	add_category,
	change_category_name,
	delete_category,
	get_categories,
	change_category_name_array,
	delete_category_array
};
