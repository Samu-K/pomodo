<script setup lang="ts">
import {
	Edit,
	List,
	MinusCircle,
	Pause,
	Play,
	RotateCcw,
	SkipForward
} from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { useCountdownTimer } from "../../components/timer/countdown";
import { Category } from "../../defines/category.ts";
import { clear_all_sessions, get_sessions } from "../../funcs/db/sesssion.ts";

onMounted(() => {
	clear_all_sessions().then(() => {
		console.log("Cleared");
		get_sessions().then((sessions) => console.log(sessions));
	});
});

const showCategoryModal = ref(false);
const timer = useCountdownTimer(5, 10);
const catEditMode = ref(false);
const showAddCategoryModal = ref(false);
const categoryColors = ["green", "purple", "orange", "red", "none"];
const newCategory = ref<Category>({
	name: "",
	color: "none",
	id: 0
});

const categories = ref<Array<Category>>([
	{
		id: 1,
		name: "work",
		color: "yellow"
	},
	{
		id: 2,
		name: "study",
		color: "green"
	},
	{
		id: 3,
		name: "cleaning",
		color: "purple"
	},
	{
		id: 4,
		name: "planning",
		color: null
	}
]);

const selected_category = ref<Category>(categories.value[0]);
const nextTask = {
	name: "Algorithm study",
	estimate: 4
};
const themeColor = computed(() =>
	timer.mode.value === timer.TIMER_MODES.FOCUS ? "pomodo-orange" : "green"
);
const showCategorySelector = computed(() => {
	if (timer.isRunning.value || timer.percent.value < 100) {
		return false;
	} else {
		return true;
	}
});

const allowSkip = computed(() => {
	if (timer.mode.value === timer.TIMER_MODES.REST) {
		return true;
	}
	if (timer.isRunning.value) {
		return false;
	}
	if (timer.percent.value < 100) {
		return true;
	} else {
		return false;
	}
});

const toggleSession = () => {
	/* session not started */
	if (timer.percent.value === 100) {
		timer.setCategoryId(selected_category.value.id);
	} else if (timer.percent.value === 0) {
		timer.setCategoryId(undefined);
	}
	timer.toggleTimer();
};

const setSelCat = (cat: Category) => {
	selected_category.value = cat;
};
// --- State for Edit Mode ---
const editableCategories = ref<Array<Category>>([]);

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
	editableCategories.value = JSON.parse(JSON.stringify(categories.value));
	catEditMode.value = true;
};

/**
 * Saves the changes from the editable copy back to the original list.
 */
const saveEdits = () => {
	// 1. Get the ID of the currently selected category *before* saving
	const selectedId = selected_category.value.id;

	// 2. Commit the changes from the copy
	categories.value = editableCategories.value;
	catEditMode.value = false;

	// 3. Find the category in the *new* list that has the same ID
	const updatedSelectedCategory = categories.value.find(
		(c) => c.id === selectedId
	);

	if (updatedSelectedCategory) {
		// 4. If found, set it. This updates the activator button text
		//    if the name was changed.
		setSelCat(updatedSelectedCategory);
	} else {
		// 5. If not found (it was deleted), select the first available
		//    category as a fallback.
		setSelCat(categories.value[0] || { id: 0, name: "None", color: null });
	}
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
	categories.value.push(newCategory.value);
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
      <!-- Progress Ring -->
      <v-progress-circular :model-value="timer.percent.value" :color="themeColor" :size="170" width="10" z-index='2'>
      </v-progress-circular>


      <!-- Focus / test -->
      <div :class="(`-mb-12 text-2xl text-${themeColor}`)">
        <div v-if="timer.mode.value === timer.TIMER_MODES.FOCUS">
          FOCUS
        </div>
        <div v-if="timer.mode.value === timer.TIMER_MODES.REST">
          REST
        </div>
      </div>
      <!-- Timer Display -->
      <div :class="(`text-timer text-${themeColor} mt-12`)">
        {{ timer.formattedTime }}
      </div>

      <div class="w-64 h-22" v-if="timer.mode.value === timer.TIMER_MODES.FOCUS">
        <!-- Category Selector -->
        <div v-if="showCategorySelector" class="flex items-center justify-center w-full">

      </div>
        <div v-if="showCategorySelector" class="flex items-center justify-center">
          <v-dialog width="auto" scrollable >

          <template v-slot:activator="{ props: activatorProps }">
            <v-btn
              color="orange"
              :text="selected_category.name"
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
                  <div
                    class="flex flex-col"
                    v-for="category in categories"
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
                      class="mt-4"
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
                  v-if="!catEditMode"
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
        :class="(`text-3xl text-${selected_category.color} text-center -mt-10`)" v-else>
        {{ selected_category.name }}
      </div>
      </div>

      <!-- Control Buttons -->
      <div class="flex items-center gap-8 absolute bottom-40">
        <button 
          @click="timer.resetTimer"
          class="w-12 h-12 rounded-full bg-dark-surface border border-dark-border text-text-secondary flex items-center justify-center"
          :disabled="timer.isRunning.value || timer.percent.value === 100"
        >
          <RotateCcw :size="20" :class="{'opacity-50': timer.isRunning.value || timer.percent.value === 100}"/>
        </button>
        
        <button 
          @click="toggleSession"
          class="w-20 h-20 rounded-full text-white hover:scale-105 transition-transform shadow-fab hover:shadow-fab-hover flex items-center justify-center"
          :class="[
            {'bg-gradient-to-br from-pomodo-orange to-pomodo-red': !timer.isRunning.value && timer.mode.value === timer.TIMER_MODES.FOCUS},
            {'bg-gradient-to-br from-green-400 to-green-700': !timer.isRunning.value && timer.mode.value === timer.TIMER_MODES.REST},
            {'bg-gradient-to-br from-gray-600 to-black': timer.isRunning.value}
          ]"
        >
            <Pause :size="32" v-if="timer.isRunning.value"/>
            <Play :size="32" v-else/>
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

    <!-- Task Preview Bar (optional) -->
    <div class="px-6 py-4 bg-dark-pure border-t border-dark-border">
      <div class="text-text-muted text-sm text-center">
        Next: {{nextTask.name }} ( {{nextTask.estimate}} pomodoros )
      </div>
    </div>
  </div>
</template>
