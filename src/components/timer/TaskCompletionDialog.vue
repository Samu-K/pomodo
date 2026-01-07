<script setup lang="ts">
import type { Task } from "../../defines/task";

defineProps<{
	modelValue: boolean;
	task: Task | null;
}>();

const emit = defineEmits<{
	(e: "update:modelValue", value: boolean): void;
	(e: "confirm"): void;
	(e: "cancel"): void;
}>();
</script>

<template>
    <v-dialog 
        :model-value="modelValue" 
        @update:model-value="emit('update:modelValue', $event)" 
        max-width="400" 
        persistent
    >
        <v-card class="rounded-xl p-4 bg-light-surface dark:bg-dark-surface">
            <v-card-title class="text-2xl font-bold bg-gradient-to-r from-pomodo-orange to-pomodo-red bg-clip-text text-transparent">
                Task Finished?
            </v-card-title>
            <v-card-text class="text-text-muted">
                You've focused the estimated {{ task?.cycles }} cycles on <b>{{ task?.title }}</b>. Is it completed?
            </v-card-text>
            <v-card-actions class="justify-end gap-2">
                <v-btn variant="text" color="grey" @click="emit('cancel')">Not Yet</v-btn>
                <v-btn color="pomodo-orange" class="text-white" @click="emit('confirm')">Yes, Mark Complete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
