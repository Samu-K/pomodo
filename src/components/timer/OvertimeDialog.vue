<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
	modelValue: boolean;
}>();

const emit = defineEmits<{
	(e: "update:modelValue", value: boolean): void;
	(e: "confirm", amount: number): void;
}>();

const overtimeAmount = ref(1);

// Reset amount when dialog opens
watch(
	() => props.modelValue,
	(newVal) => {
		if (newVal) {
			overtimeAmount.value = 1;
		}
	}
);

const handleConfirm = () => {
	emit("confirm", overtimeAmount.value);
	emit("update:modelValue", false);
};

const handleCancel = () => {
	emit("update:modelValue", false);
};

const handleDontKnow = () => {
	emit("confirm", 0);
	emit("update:modelValue", false);
};
</script>

<template>
    <v-dialog 
        :model-value="modelValue" 
        @update:model-value="emit('update:modelValue', $event)"
        max-width="500"
    >
        <v-card class="rounded-xl bg-light-surface dark:bg-dark-surface overflow-hidden">
            <div class="p-6">
                <v-card-title class="text-2xl font-bold px-0 pt-0">Add Overtime</v-card-title>
                <v-card-text class="px-0">
                    <p class="text-text-muted mb-6 text-lg">How many more cycles do you need for this task?</p>
                    <v-slider
                        v-model="overtimeAmount"
                        :min="1"
                        :max="10"
                        :step="1"
                        thumb-label
                        color="pomodo-orange"
                        class="mt-4"
                    ></v-slider>
                    <div class="text-center font-bold text-pomodo-orange text-3xl mt-2">
                        +{{ overtimeAmount }} {{ overtimeAmount === 1 ? 'cycle' : 'cycles' }}
                    </div>
                </v-card-text>
            </div>

            <div class="grid grid-cols-2 border-t border-black/5 dark:border-white/5">
                <button 
                    class="p-3 text-sm font-medium text-text-muted hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-r border-b border-black/5 dark:border-white/5" 
                    @click="handleCancel"
                >
                    Cancel
                </button>
                <button 
                    class="p-3 text-sm font-medium text-text-muted hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-black/5 dark:border-white/5" 
                    @click="handleDontKnow"
                >
                    Don't know
                </button>
                <button 
                    class="col-span-2 p-3 text-base font-bold text-pomodo-orange hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    @click="handleConfirm"
                >
                    Add & Continue
                </button>
            </div>
        </v-card>
    </v-dialog>
</template>
