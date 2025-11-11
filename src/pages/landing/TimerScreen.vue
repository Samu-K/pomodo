<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import {
	MinusCircle,
	Pause,
	Play,
	RotateCcw,
	SkipForward
} from "lucide-vue-next";
import { computed, type Ref, ref } from "vue";
import { useCountdownTimer } from "../../components/timer/countdown";
import { Category } from "../../defines/category.ts";
import {
	add_category,
	change_category_name_array,
	delete_category_array,
	get_categories
} from "../../funcs/db/categories.ts";

const queryClient = useQueryClient();

const categoriesState = useQuery({
	queryKey: ["categories"],
	queryFn: get_categories
});
const categories: Ref<Category[] | undefined> = categoriesState.data;

const deleteCatState = useMutation({
	mutationFn: async (cat_array: Category[]) =>
		await delete_category_array(cat_array),
	onError: () => {
		console.log("Error deleting categories");
	},
	onSuccess: async () => {
		await queryClient.invalidateQueries({ queryKey: ["categories"] });
	},
	onSettled: () => {
		if (categoriesState.data.value) {
			// is selected category still in categories
			if (
				!categoriesState.data.value.find((c) =>
					selected_category.value ? c.id === selected_category.value.id : false
				)
			) {
				// not found or not set
				setSelCat(null);
			}
		} else {
			setSelCat(null);
		}
	}
});

const changeCatState = useMutation({
	mutationFn: async (cat_array: Category[]) =>
		await change_category_name_array(cat_array),
	onSuccess: async () => {
		await queryClient.invalidateQueries({ queryKey: ["categories"] });
	},
	onSettled: () => {
		if (categories.value) {
			let newCat = categories.value.find((c) =>
				selected_category.value ? c.id === selected_category.value.id : false
			);
			setSelCat(newCat ? newCat : null);
		}
	}
});

const addCatState = useMutation({
	mutationFn: async (cat: Category) => await add_category(cat),
	onSuccess: async () => {
		await queryClient.invalidateQueries({ queryKey: ["categories"] });
	}
});

const timer = ref(useCountdownTimer(5, 10));
const catEditMode = ref(false);
const showAddCategoryModal = ref(false);
const categoryColors = ["green", "purple", "orange", "red", "none"];
const newCategory = ref<Category>({
	name: "",
	color: "none",
	id: 0
});

const selected_category = ref<Category | null>();
const nextTask = {
	name: "Algorithm study",
	estimate: 4
};
const themeColor = computed(() =>
	timer.value.mode === timer.value.TIMER_MODES.FOCUS ? "pomodo-orange" : "green"
);
const showCategorySelector = computed(() => {
	if (timer.value.isRunning || timer.value.percent < 100) {
		return false;
	} else {
		return true;
	}
});

const allowSkip = computed(() => {
	if (timer.value.mode === timer.value.TIMER_MODES.REST) {
		return true;
	}
	if (timer.value.isRunning) {
		return false;
	}
	if (timer.value.percent < 100) {
		return true;
	} else {
		return false;
	}
});

const toggleSession = () => {
	if (selected_category.value) {
		/* session not started */
		if (timer.value.percent === 100) {
			timer.value.setCategoryId(selected_category.value.id);
		} else if (timer.value.percent === 0) {
			timer.value.setCategoryId(undefined);
		}
		timer.value.toggleTimer();
	}
};

const setSelCat = (cat: Category | null) => {
	selected_category.value = cat;
};
// --- State for Edit Mode ---
const editableCategories = ref<Category[]>([]);

// --- State for Delete Confirmation ---
const showDeleteConfirm = ref(false);
const categoryToDelete = ref<Category | null>(null);

// --- Methods for Editing ---

/**
 * Enters edit mode by making a deep copy of the categories.
 * We edit the copy so we can cancel without saving.
 */
const openEditMode = () => {
	// Create a deep copy to edit, so we can cancel
	if (categories.value) {
		editableCategories.value = JSON.parse(JSON.stringify(categories.value));
	} else {
		editableCategories.value = [];
	}
	catEditMode.value = true;
};

/**
 * ⭐ NEW SAVE LOGIC ⭐
 * Calculates the delta (changes) and applies them to the original list.
 * This prepares for a real DB/API call.
 */
const saveEdits = () => {
	if (categories.value && editableCategories.value) {
		// 2. Calculate the deltas
		const toUpdate: Category[] = [];
		const toDelete: Category[] = [];

		// Find Creates and Updates by iterating the new list
		for (const editedCat of editableCategories.value) {
			if (editedCat.id > 0) {
				// It's an existing category, check if it was modified
				const originalCat = categories.value.find((c) => c.id === editedCat.id);
				if (originalCat && originalCat.name !== editedCat.name) {
					// Name was changed, add to update list
					toUpdate.push(editedCat);
				}
			}
		}

		// Find Deletes by iterating the original list
		for (const originalCat of categories.value) {
			// If it's not in the new list, it was deleted
			if (!editableCategories.value.some((c) => c.id === originalCat.id)) {
				toDelete.push(originalCat);
			}
		}

		// --- 💡 DB INTEGRATION POINT ---
		// This is where you would make your API calls.
		// You would wait for all promises to resolve.
		//
		if (toUpdate.length > 0) {
			changeCatState.mutate(toUpdate);
		}
		if (toDelete.length > 0) {
			deleteCatState.mutate(toDelete);
		}
	}
	// 5. Exit edit mode
	catEditMode.value = false;
};

/**
 * Exits edit mode and discards any changes.
 */
const cancelEdits = () => {
	// Discard the copy and exit edit mode
	catEditMode.value = false;
	editableCategories.value = [];
};

// --- Methods for Deleting ---

/**
 * Opens the delete confirmation modal for a specific category.
 */
const promptDelete = (category: Category) => {
	categoryToDelete.value = category;
	showDeleteConfirm.value = true;
};

/**
 * Confirms deletion and removes the category from the *editable* list.
 */
const confirmDelete = () => {
	if (!categoryToDelete.value) return;

	// Remove the category from the *editable* list
	editableCategories.value = editableCategories.value.filter(
		(c) => c.id !== categoryToDelete.value?.id
	);

	cancelDelete(); // Close modal and clear target
};

/**
 * Closes the delete confirmation modal.
 */
const cancelDelete = () => {
	showDeleteConfirm.value = false;
	categoryToDelete.value = null;
};

const createCategory = () => {
	addCatState.mutate(newCategory.value);

	newCategory.value = {
		id: 0,
		name: "",
		color: "none"
	};
	showAddCategoryModal.value = false;
};
</script>

<template>
  <div class="flex flex-col h-full bg-dark-bg">
    <!-- Main Timer Container -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 gap-10">
      <div class="absolute items-center justify-center top-10">
        {{timer.sessions}} 
        <p>IS RUNNING {{timer.isRunning}}</p>
      </div>
      <!-- Progress Ring -->
      <v-progress-circular :model-value="timer.percent" :color="themeColor" :size="170" width="10" z-index='2'>
      </v-progress-circular>


      <!-- Focus / test -->
      <div :class="(`-mb-12 text-2xl text-${themeColor}`)">
        <div v-if="timer.mode=== timer.TIMER_MODES.FOCUS">
          FOCUS
        </div>
        <div v-if="timer.mode=== timer.TIMER_MODES.REST">
          REST
        </div>
      </div>
      <!-- Timer Display -->
      <div :class="(`text-timer text-${themeColor} mt-12`)">
        {{ timer.formattedTime }}
      </div>

      <div class="w-64 h-22" v-if="timer.mode === timer.TIMER_MODES.FOCUS">
        <!-- Category Selector -->
        <div v-if="showCategorySelector" class="flex items-center justify-center">
          <v-dialog width="auto" scrollable >

          <template v-slot:activator="{ props: activatorProps }">
            <v-btn
              :color="selected_category ? selected_category.color : 'orange'"
              :text="selected_category ? selected_category.name : 'Select category'"
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
                  <div v-if="categories ? categories.length === 0 : true" class="items-center justify-center">
                    No categories, create one with the button below
                  </div>
                  <div
                    class="flex flex-col"
                    v-for="category in categories"
                    v-else
                    :key="category.id"
                  >
                    <v-btn
                      variant="tonal"
                      class="mt-4"
                      @click="() => {
                        setSelCat(category);
                        isActive.value = false;
                      }"
                    >
                      {{ category.name }}
                    </v-btn>
                  </div>
                  <div class="flex items-center justify-center mt-4">
                    <v-btn variant="elevated" color="#09402B" @click="showAddCategoryModal = true">
                        Add category
                    </v-btn>
                  </div>
                </div>

                <div v-else>
                  <div
                    class="flex flex-col"
                    v-for="category in editableCategories"
                    :key="category.id"
                  >
                    <v-text-field
                      v-model="category.name"
                      class="mt-4 "
                      variant="outlined"
                      density="compact"
                      hide-details
                      :append-inner-icon="MinusCircle"
                      @click:append-inner="promptDelete(category)"
                    >
                    </v-text-field>
                  </div>
                </div>
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions>
                <v-btn text="Cancel" @click="isActive.value = false" v-if="!catEditMode"></v-btn>

                <v-spacer></v-spacer>

                <v-btn
                  color="surface-variant"
                  text="Edit"
                  variant="flat"
                  v-if="!catEditMode || (categories ? categories.length === 0 : true)"
                  :disabled="categories ? categories.length === 0 : true"
                  @click="openEditMode"
                ></v-btn>

                <template v-else>
                  <v-btn
                    text="Cancel"
                    @click="cancelEdits"
                  ></v-btn>
                  <v-btn
                    color="surface-variant"
                    text="Save"
                    variant="flat"
                    @click="() => {saveEdits();isActive.value = false}"
                  ></v-btn>
                </template>
              </v-card-actions>

              <v-dialog v-model="showDeleteConfirm" width="auto" persistent>
                <v-card>
                  <v-card-title class="text-h5">
                    Confirm Deletion
                  </v-card-title>
                  <v-card-text>
                    Are you sure you want to delete the category
                    <strong>"{{ categoryToDelete?.name }}"</strong>?
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                      text="Cancel"
                      @click="cancelDelete"
                    ></v-btn>
                    <v-btn
                      color="red-darken-1"
                      text="Delete"
                      @click="confirmDelete"
                    ></v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>

              <v-dialog v-model="showAddCategoryModal" width="auto" persistent>
                <v-card class="px-6 py-2">
                  <v-card-title class="text-h5">
                    Add category 
                  </v-card-title>
                  <v-text-field label="Name" placeholder="Category name" v-model="newCategory.name">
                  </v-text-field>
                  <v-select v-model="newCategory.color" :items="categoryColors" label="Color">
                  </v-select>
                  
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                      text="Cancel"
                      @click="showAddCategoryModal = false"
                      class="px-6"
                    ></v-btn>
                    <v-btn
                      color="green-darken-1"
                      text="Create"
                      :disabled="newCategory.name.length === 0"
                      @click="createCategory"
                    ></v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-card>
          </template>
        </v-dialog>
      </div>
      <div 
        :class="(`text-3xl text-${selected_category ? selected_category.color : 'pomodo-orange'} text-center -mt-10`)" v-else>
        {{ selected_category ? selected_category.name : "No category selected"}}
      </div>
      </div>

    <!-- Task Preview Bar (optional)
    <div class="px-6 py-4 bg-dark-pure border-t border-dark-border">
      <div class="text-text-muted text-sm text-center">
        Next: {{nextTask.name }} ( {{nextTask.estimate}} pomodoros )
      </div>
    </div>
    -->
  </div>
    <!-- Control Buttons -->
    <div class="flex items-center justify-center gap-8 w-full pb-8">
      <button 
        @click="timer.resetTimer"
        class="w-12 h-12 rounded-full bg-dark-surface border border-dark-border text-text-secondary flex items-center justify-center"
        :disabled="timer.isRunning || timer.percent === 100"
      >
        <RotateCcw :size="20" :class="{'opacity-50': timer.isRunning|| timer.percent=== 100}"/>
      </button>
      
      <button 
        @click="toggleSession"
        :disabled="!selected_category"
        class="w-20 h-20 rounded-full text-white flex items-center justify-center"
        :class="[
          {'bg-gradient-to-br from-pomodo-orange to-pomodo-red': !timer.isRunning&& timer.mode=== timer.TIMER_MODES.FOCUS && selected_category},
          {'bg-gradient-to-br from-green-400 to-green-700': !timer.isRunning&& timer.mode=== timer.TIMER_MODES.REST},
          {'bg-gradient-to-br from-gray-600 to-black': timer.isRunning},
          {'bg-gradient-to-br from-gray-900 to-black opacity-70': !selected_category},
          {'hover:scale-105 transition-transform shadow-fab hover:shadow-fab-hover ': selected_category}
        ]"
      >
          <Pause :size="32" v-if="timer.isRunning"/>
          <Play :size="32" v-if="!timer.isRunning"/>
      </button>
      
      <button 
        class="w-12 h-12 rounded-full bg-dark-surface border border-dark-border text-text-secondary flex items-center justify-center"
        :disabled="!allowSkip"
        :class="{'opacity-50': !allowSkip}"
        @click="timer.skip"
      >
        <SkipForward :size="20" />
      </button>
    </div>
  </div>

</template>
