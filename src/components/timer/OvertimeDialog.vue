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
</script>

<template>
    <v-dialog 
        :model-value="modelValue" 
        @update:model-value="emit('update:modelValue', $event)"
        max-width="400"
    >
        <v-card class="rounded-xl p-4 bg-light-surface dark:bg-dark-surface">
            <v-card-title class="text-xl font-bold">Add Overtime</v-card-title>
            <v-card-text>
                <p class="text-text-muted mb-4">How many more cycles do you need for this task?</p>
                <v-slider
                    v-model="overtimeAmount"
                    :min="1"
                    :max="10"
                    :step="1"
                    thumb-label
                    color="pomodo-orange"
                ></v-slider>
                <div class="text-center font-bold text-pomodo-orange">
                    +{{ overtimeAmount }} {{ overtimeAmount === 1 ? 'cycle' : 'cycles' }}
                </div>
            </v-card-text>
            <v-card-actions class="justify-end gap-2">
                <v-btn variant="text" color="grey" @click="handleCancel">Cancel</v-btn>
                <v-btn variant="text" color="grey" @click="handleCancel">Don't know</v-btn>
                <v-btn color="pomodo-orange" class="text-white" @click="handleConfirm">Add & Continue</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
