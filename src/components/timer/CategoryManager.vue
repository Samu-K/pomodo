<script setup lang="ts">
import { ref } from "vue";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { MinusCircle } from "lucide-vue-next";
import {
	add_category,
	change_category_name_array,
	delete_category_array,
	get_categories
} from "../../funcs/db/categories.ts";
import type { Category } from "../../defines/category.ts";

const props = defineProps<{
	selectedCategory: Category | null | undefined;
}>();

const emit = defineEmits<{
	(e: "select", category: Category): void;
}>();

const queryClient = useQueryClient();

// --- Data ---
const { data: categories } = useQuery({
	queryKey: ["categories"],
	queryFn: get_categories
});

// --- Mutations ---
const changeCatState = useMutation({
	mutationFn: change_category_name_array,
	onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] })
});

const deleteCatState = useMutation({
	mutationFn: delete_category_array,
	onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] })
});

const addCatState = useMutation({
	mutationFn: add_category,
	onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] })
});

// --- UI State ---
const showDialog = ref(false);
const showAddCategoryModal = ref(false);
const catEditMode = ref(false);
const showDeleteConfirm = ref(false);
const categoryToDelete = ref<Category | null>(null);

// Edit Mode State (Deep Copy)
const editableCategories = ref<Category[]>([]);
const newCategory = ref<Category>({ name: "", color: "none", id: 0 });
const categoryColors = ["green", "purple", "orange", "red", "none"];

// --- Logic ---

const openEditMode = () => {
	if (categories.value) {
		// Deep copy for safe editing
		editableCategories.value = JSON.parse(JSON.stringify(categories.value));
	} else {
		editableCategories.value = [];
	}
	catEditMode.value = true;
};

const saveEdits = () => {
	if (!categories.value || !editableCategories.value) return;

	const toUpdate: Category[] = [];
	const toDelete: Category[] = [];

	// Find Updates
	for (const editedCat of editableCategories.value) {
		if (editedCat.id > 0) {
			const original = categories.value.find((c) => c.id === editedCat.id);
			if (original && original.name !== editedCat.name) {
				toUpdate.push(editedCat);
			}
		}
	}

	// Find Deletes (Items in original but missing in editable)
	for (const original of categories.value) {
		if (!editableCategories.value.some((c) => c.id === original.id)) {
			toDelete.push(original);
		}
	}

	if (toUpdate.length > 0) changeCatState.mutate(toUpdate);
	if (toDelete.length > 0) deleteCatState.mutate(toDelete);

	catEditMode.value = false;
};

const cancelEdits = () => {
	catEditMode.value = false;
	editableCategories.value = [];
};

const createCategory = () => {
	addCatState.mutate(newCategory.value);
	newCategory.value = { id: 0, name: "", color: "none" };
	showAddCategoryModal.value = false;
};

// Delete Confirmation
const promptDelete = (cat: Category) => {
	categoryToDelete.value = cat;
	showDeleteConfirm.value = true;
};

const confirmDelete = () => {
	if (!categoryToDelete.value) return;
	// Remove from editable list
	editableCategories.value = editableCategories.value.filter(
		(c) => c.id !== categoryToDelete.value?.id
	);
	showDeleteConfirm.value = false;
	categoryToDelete.value = null;
};
</script>

<template>
    <v-dialog v-model="showDialog" width="auto" scrollable>
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn
                :color="selectedCategory ? selectedCategory.color : 'orange'"
                :text="selectedCategory ? selectedCategory.name : 'Select category'"
                variant="outlined"
                v-bind="activatorProps"
                class="px-12"
            ></v-btn>
        </template>

        <template v-slot:default="{ isActive }">
            <v-card title="Select category">
                <v-divider class="mt-1"></v-divider>

                <v-card-text class="px-4" style="height: 300px">
                    <div v-if="!catEditMode">
                        <div v-if="!categories || categories.length === 0" class="items-center justify-center">
                            No categories, create one below.
                        </div>
                        <div class="flex flex-col" v-for="cat in categories" :key="cat.id">
                            <v-btn variant="tonal" class="mt-4" 
                                @click="() => { emit('select', cat); isActive.value = false; }">
                                {{ cat.name }}
                            </v-btn>
                        </div>
                        <div class="flex items-center justify-center mt-4">
                            <v-btn variant="elevated" color="#09402B" @click="showAddCategoryModal = true">
                                Add category
                            </v-btn>
                        </div>
                    </div>

                    <div v-else>
                        <div class="flex flex-col" v-for="cat in editableCategories" :key="cat.id">
                            <v-text-field
                                v-model="cat.name"
                                class="mt-4"
                                variant="outlined"
                                density="compact"
                                hide-details
                                :append-inner-icon="MinusCircle"
                                @click:append-inner="promptDelete(cat)"
                            ></v-text-field>
                        </div>
                    </div>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions>
                    <v-btn text="Cancel" @click="isActive.value = false" v-if="!catEditMode"></v-btn>
                    <v-spacer></v-spacer>

                    <template v-if="!catEditMode">
                        <v-btn
                            color="surface-variant"
                            text="Edit"
                            variant="flat"
                            :disabled="!categories || categories.length === 0"
                            @click="openEditMode"
                        ></v-btn>
                    </template>
                    <template v-else>
                        <v-btn text="Cancel" @click="cancelEdits"></v-btn>
                        <v-btn color="surface-variant" text="Save" variant="flat" @click="saveEdits"></v-btn>
                    </template>
                </v-card-actions>
            </v-card>
        </template>
    </v-dialog>

    <v-dialog v-model="showDeleteConfirm" width="auto" persistent>
        <v-card title="Confirm Deletion">
            <v-card-text>Are you sure you want to delete "{{ categoryToDelete?.name }}"?</v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text="Cancel" @click="showDeleteConfirm = false"></v-btn>
                <v-btn color="red-darken-1" text="Delete" @click="confirmDelete"></v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="showAddCategoryModal" width="auto" persistent>
        <v-card class="px-6 py-2" title="Add category">
            <v-text-field label="Name" v-model="newCategory.name"></v-text-field>
            <v-select v-model="newCategory.color" :items="categoryColors" label="Color"></v-select>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text="Cancel" @click="showAddCategoryModal = false"></v-btn>
                <v-btn color="green-darken-1" text="Create" :disabled="!newCategory.name" @click="createCategory"></v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
