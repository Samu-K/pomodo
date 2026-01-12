<script setup lang="ts">
import { MinusCircle, PlusCircle } from "lucide-vue-next";
import { onMounted, ref } from "vue";
import type { Category } from "../../funcs/commands";
import { useCategoryStore } from "../../stores/categories";
import EmptyState from "../ui/EmptyState.vue";

defineProps<{
	selectedCategory: Category | null | undefined;
}>();

const emit = defineEmits<(e: "select", category: Category) => void>();

const categoryStore = useCategoryStore();

// --- Data ---
onMounted(() => {
	if (categoryStore.categories.length === 0) {
		categoryStore.fetchCategories();
	}
});

// --- UI State ---
const showDialog = ref(false);
const showAddCategoryModal = ref(false);
const catEditMode = ref(false);
const showDeleteConfirm = ref(false);
const categoryToDelete = ref<Category | null>(null);

import AddCategoryDialog from "./AddCategoryDialog.vue";

// Edit Mode State (Deep Copy)
const editableCategories = ref<Category[]>([]);

// --- Logic ---

const openEditMode = () => {
	if (categoryStore.categories) {
		// Deep copy for safe editing
		editableCategories.value = JSON.parse(
			JSON.stringify(categoryStore.categories)
		);
	} else {
		editableCategories.value = [];
	}
	catEditMode.value = true;
};

import { useTimerStore } from "../../stores/timer";

const timerStore = useTimerStore();

const saveEdits = async () => {
	if (!categoryStore.categories || !editableCategories.value) return;

	const toUpdate: Category[] = [];
	const toDelete: Category[] = [];

	// Find Updates
	for (const editedCat of editableCategories.value) {
		if (editedCat.id > 0) {
			const original = categoryStore.categories.find(
				(c) => c.id === editedCat.id
			);
			if (original && original.name !== editedCat.name) {
				toUpdate.push(editedCat);
			}
		}
	}

	// Find Deletes (Items in original but missing in editable)
	for (const original of categoryStore.categories) {
		if (!editableCategories.value.some((c) => c.id === original.id)) {
			toDelete.push(original);
			// If the deleted category is currently selected in the timer, clear it
			if (timerStore.categoryId === original.id) {
				timerStore.setCategoryId(null);
			}
		}
	}

	if (toUpdate.length > 0) await categoryStore.updateCategories(toUpdate);
	if (toDelete.length > 0) await categoryStore.removeCategories(toDelete);

	catEditMode.value = false;
};

const cancelEdits = () => {
	catEditMode.value = false;
	editableCategories.value = [];
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

// Expose showDialog so parent can open the dialog programmatically
defineExpose({
	showDialog
});
</script>

<template>
    <v-dialog v-model="showDialog" width="80%" scrollable>
        <template v-slot:activator="{ props: activatorProps }">
            <v-btn
                :color="selectedCategory?.color ?? undefined"
                :text="selectedCategory ? selectedCategory.name : 'Select category'"
                variant="outlined"
                v-bind="activatorProps"
                class="px-12"
            ></v-btn>
        </template>

        <template v-slot:default="{ isActive }">
            <v-card title="Select category">
                <v-divider class="mt-1"></v-divider>

                <v-card-text class="px-12" style="height: 380px" >
                    <div v-if="!catEditMode">
                        <EmptyState 
                            v-if="!categoryStore.categories || categoryStore.categories.length === 0"
                            title="No categories"
                            description="Create a category to get started"
                        />
                        
                        <div v-else class="flex flex-col" v-for="cat in categoryStore.categories" :key="cat.id">
                            <v-btn variant="tonal" class="mt-4" 
                                @click="() => { emit('select', cat); isActive.value = false; }">
                                {{ cat.name }}
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

                <v-card-actions style="display: grid !important; grid-template-columns: 1fr 1fr 1fr;" v-if="!catEditMode">
                    <div class="flex justify-start">
                        <v-btn text="Cancel" @click="isActive.value = false"></v-btn>
                    </div>

                    <div class="flex justify-center">
                        <v-btn variant="elevated" color="#09402B" @click="showAddCategoryModal = true">
                            <PlusCircle/>
                        </v-btn>
                    </div>

                    <div class="flex justify-end">
                        <v-btn
                            color="surface-variant"
                            text="Edit"
                            variant="flat"
                            :disabled="!categoryStore.categories || categoryStore.categories.length === 0"
                            @click="openEditMode"
                        ></v-btn>
                    </div>
                </v-card-actions>
                <v-card-actions v-else>
                    <v-btn text="Cancel" @click="cancelEdits"></v-btn>
                    <v-btn color="surface-variant" text="Save" variant="flat" @click="saveEdits"></v-btn>
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

    <AddCategoryDialog 
        v-model="showAddCategoryModal"
    />
</template>
