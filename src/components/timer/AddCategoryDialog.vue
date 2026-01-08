<script setup lang="ts">
import { ref } from "vue";
import type { Category } from "../../funcs/commands";
import { useCategoryStore } from "../../stores/categories";
import { useThemeStore } from "../../stores/theme";

defineProps<{
	modelValue: boolean;
}>();

const emit = defineEmits(["update:modelValue", "created"]);

const categoryStore = useCategoryStore();
const themeStore = useThemeStore();

const newCategory = ref<Category>({
	id: 0,
	name: "",
	color: themeStore.categoryColors[0] || "none"
});

const close = () => {
	emit("update:modelValue", false);
	newCategory.value = {
		id: 0,
		name: "",
		color: themeStore.categoryColors[0] || "none"
	};
};

const createCategory = async () => {
	if (!newCategory.value.name) return;
	await categoryStore.createCategory(newCategory.value);
	const createdCat =
		categoryStore.categories.find((c) => c.name === newCategory.value.name) ||
		newCategory.value;
	emit("created", createdCat);
	close();
};
</script>

<template>
    <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" width="auto" persistent>
        <v-card class="px-6 py-2" title="Add category">
            <div class="mt-4">
                <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider mb-2">
                    Name *
                </label>
                <v-text-field v-model="newCategory.name" placeholder="Category name" hide-details class="mb-4"></v-text-field>
            </div>
            <div class="mb-4">
                <label class="block text-xs font-semibold text-lightText-secondary dark:text-text-secondary uppercase tracking-wider mb-3">
                    Color
                </label>
                <div class="grid grid-cols-6 gap-2">
                    <button
                        v-for="color in themeStore.categoryColors"
                        :key="color"
                        @click="newCategory.color = color"
                        :class="[
                            'w-8 h-8 rounded-full transition-all hover:scale-110',
                            newCategory.color === color ? 'ring-2 ring-lightText-primary dark:ring-white ring-offset-2 ring-offset-light-bg dark:ring-offset-dark-bg' : ''
                        ]"
                        :style="`background-color: ${color}`"
                    ></button>
                </div>
            </div>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text="Cancel" @click="close"></v-btn>
                <v-btn color="green-darken-1" text="Create" :disabled="!newCategory.name" @click="createCategory"></v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
