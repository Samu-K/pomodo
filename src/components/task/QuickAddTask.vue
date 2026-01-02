<script setup lang="ts">
import { ref, computed } from "vue";
import { Plus, Tag, ChevronDown } from "lucide-vue-next";
import { useTasks } from "../../stores/task";
import { useCategoryStore } from "../../stores/categories";
import { useUIStore } from "../../stores/ui";
import type { Task } from "../../defines/task";

const tasksStore = useTasks();
const categoryStore = useCategoryStore();
const uiStore = useUIStore();

const taskTitle = ref("");
const selectedCategoryId = ref(null as number | null);

const selectedCategory = computed(() => {
	if (selectedCategoryId.value === null) return null;
	return (
		categoryStore.categories.find((c) => c.id === selectedCategoryId.value) ||
		null
	);
});

const handleAdd = async () => {
	if (!taskTitle.value.trim()) return;

	try {
		const newTask: Task = {
			id: 0,
			title: taskTitle.value,
			category: null,
			category_id: selectedCategoryId.value,
			cycles: 1,
			startTime: new Date(),
			completed: false,
			completedCycles: 0,
			gradient: "from-pomodo-orange to-pomodo-red"
		};

		await tasksStore.addTask(newTask);
		uiStore.showSuccess(`Added "${taskTitle.value}"`);
		taskTitle.value = "";
	} catch (error) {
		uiStore.setError("Failed to add task");
		console.error(error);
	}
};

const selectCategory = (id: number | null) => {
	selectedCategoryId.value = id;
};

const getCategoryColor = (colorName: string | null | undefined) => {
	if (!colorName) return "bg-pomodo-orange";
	return colorName.startsWith("bg-") ? colorName : `bg-${colorName}`;
};
</script>

<template>
  <div class="bg-light-surface dark:bg-[#2a2a3a] p-1 rounded-full border border-light-border dark:border-dark-border shadow-lg focus-within:ring-2 focus-within:ring-pomodo-orange/20 focus-within:border-pomodo-orange transition-all flex items-center group max-w-xl mx-auto">
    <!-- Input Section -->
    <div class="flex-1 flex items-center gap-2 pl-2">
        <button 
            @click="handleAdd"
            class="w-10 h-10 rounded-full bg-light-bg dark:bg-dark-bg flex items-center justify-center text-text-muted hover:text-pomodo-orange hover:bg-pomodo-orange/10 transition-all shadow-sm cursor-pointer"
        >
            <Plus :size="20" stroke-width="3" />
        </button>
        <input 
            v-model="taskTitle"
            type="text"
            placeholder="New Task"
            class="w-full bg-transparent py-3 outline-none text-lightText-primary dark:text-text-primary placeholder:text-text-muted font-bold text-lg"
            @keyup.enter="handleAdd"
        />
    </div>

    <!-- Divider -->
    <div class="h-8 w-px bg-light-border dark:bg-dark-border mx-2"></div>
    
    <!-- Category Selector Section -->
    <v-menu offset="8">
        <template v-slot:activator="{ props }">
            <button 
                v-bind="props"
                class="flex items-center gap-3 px-6 py-3 rounded-full hover:bg-light-bg dark:hover:bg-dark-bg transition-colors text-sm font-black uppercase tracking-widest text-text-secondary whitespace-nowrap min-w-[140px] justify-between group/cat"
            >
                <div class="flex items-center gap-2">
                    <div v-if="selectedCategory" class="w-3 h-3 rounded-full shadow-sm" :class="getCategoryColor(selectedCategory.color)"></div>
                    <Tag v-else :size="16" class="text-pomodo-orange" />
                    <span :class="{'text-lightText-primary dark:text-text-primary': selectedCategory}">
                        {{ selectedCategory?.name || 'Category' }}
                    </span>
                </div>
                <ChevronDown :size="16" class="text-text-muted group-hover/cat:text-pomodo-orange transition-colors" />
            </button>
        </template>

        <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden min-w-[200px] mt-2">
            <div class="py-2 max-h-60 overflow-y-auto">
                <button 
                    @click="selectCategory(null)"
                    class="w-full text-left px-5 py-3 text-sm font-bold hover:bg-light-bg dark:hover:bg-dark-bg transition-colors flex items-center gap-3"
                    :class="{'text-pomodo-orange bg-pomodo-orange/5': selectedCategoryId === null}"
                >
                    <div class="w-2.5 h-2.5 rounded-full bg-text-muted/30"></div>
                    <span class="flex-1">No Category</span>
                </button>
                <div class="h-px bg-light-border dark:bg-dark-border my-1 mx-4 opacity-50"></div>
                <button 
                    v-for="cat in categoryStore.categories" 
                    :key="cat.id"
                    @click="selectCategory(cat.id)"
                    class="w-full text-left px-5 py-3 text-sm font-bold hover:bg-light-bg dark:hover:bg-dark-bg transition-colors flex items-center gap-3"
                    :class="{'text-pomodo-orange bg-pomodo-orange/5': selectedCategoryId === cat.id}"
                >
                    <div class="w-2.5 h-2.5 rounded-full shadow-sm" :class="getCategoryColor(cat.color)"></div>
                    <span class="flex-1">{{ cat.name }}</span>
                </button>
            </div>
        </div>
    </v-menu>
  </div>
</template>
