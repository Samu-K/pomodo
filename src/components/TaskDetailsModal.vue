<script setup lang="ts">
import { Check, Minus, Plus } from "lucide-vue-next";
import { ref } from "vue";

const emit = defineEmits<{
	close: [];
}>();

interface Task {
	id: number;
	title: string;
	category: string;
	cycles: number;
	startTime: Date;
	gradient: string;
}

const ex_date: Date = new Date(2025, 12, 10, 18);
const exTask: Task = {
	id: 0,
	title: "ExTitle",
	category: "work",
	cycles: 2,
	startTime: ex_date,
	gradient: "no-matter",
};

const exampleRef = ref(exTask);
const categories = ["work", "school", "other"];
</script>

<template>
  <div class="fixed inset-0 bg-black bg-transparent flex items-center justify-center z-50 animate-fade-in">
    <div class="w-[80%] h-[70%] flex items-start justify-between bg-gradient-to-br from-dark-bg to-dark-surface opacity-95">
      <div class="ml-6 mt-6 flex-col text-text-primary">
      <div class="space-y-4">
        <h2
          class="ml-2 mt-2 text-xl font-bold "
          > Edit task </h2>
        <!-- Task Name -->
        <div>
          <v-text-field
            label="Task name"
            :model-value="exTask.title"
          ></v-text-field>
        </div>

        <!-- Category -->
        <div>
          <v-select 
            label="Category"
            :model-value="exTask.category"
            :items="categories"
          >
          </v-select>
        </div>

        <!-- Estimated Pomodoros -->
        <div>
          <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Estimated Pomodoros
          </label>
        </div>
          <v-number-input
          :reverse="false"
          :min=0
          controlVariant="split"
          :hideInput="false"
          :inset="false"
          :model-value="exTask.cycles"
        ></v-number-input>

        <!-- Schedule For -->
        <div class="w-full flex-col items-start justify-start">
          <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Schedule For
          </label>
          <v-input class="flex-1 w-42 h-42" label="Date input"></v-input>
        </div>
      </div>


      <div class="flex gap-3 mt-8 ">
        <button 
          @click="emit('close')"
          class="flex-1 py-2 bg-dark-surface border border-dark-border rounded-lg text-text-secondary font-semibold hover:bg-dark-border transition-colors"
        >
          Close 
        </button>
        <button class="flex-1 py-2 bg-gradient-to-r from-pomodo-orange to-pomodo-red rounded-lg text-white font-semibold hover:opacity-90 transition-opacity">
          Save  
        </button>
      </div>
      </div>
    </div>
  </div> 
</template>
