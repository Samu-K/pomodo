import type { Category } from "../commands";
import { commands } from "../commands";

const get_categories = async () => {
	const res = await commands.categoriesGetCategories();
	if (res.status === "error") throw new Error(res.error.message);
	return res.data || [];
};

const add_category = async (new_category: Category) => {
	const res = await commands.categoriesAddCategory(new_category);
	if (res.status === "error") throw new Error(res.error.message);
	return res.data;
};

const delete_category = async (category_id: number) => {
	const res = await commands.categoriesDeleteCategory(category_id);
	if (res.status === "error") throw new Error(res.error.message);
	return res.data;
};

const change_category_name = async (category_id: number, new_name: string) => {
	const res = await commands.categoriesSetCategoryName(new_name, category_id);
	if (res.status === "error") throw new Error(res.error.message);
	return res.data;
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
