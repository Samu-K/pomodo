<script setup lang="ts">
import { ref } from 'vue'
import { X, Plus, Minus, Check } from 'lucide-vue-next'

const emit = defineEmits<{
  close: []
}>()

// Form data
const taskName = ref('')
const selectedCategory = ref('Work')
const estimatedPomodoros = ref(4)
const scheduleDate = ref('')
const isRecurring = ref(true)
const repeatOption = ref('Daily')
const priority = ref<'Low' | 'Medium' | 'High'>('Medium')

const categories = ['Work', 'Study', 'Personal']
const repeatOptions = ['Daily', 'Weekdays', 'Weekly', 'Custom']
</script>

<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
    <div class="bg-dark-bg rounded-2xl p-6 w-full max-w-md mx-4 animate-scale-in border border-dark-border">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-pomodo-orange">Create New Task</h2>
        <button 
          @click="emit('close')"
          class="w-8 h-8 flex items-center justify-center text-text-muted hover:text-white transition-colors"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Form -->
      <div class="space-y-5">
        <!-- Task Name -->
        <div>
          <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Task Name
          </label>
          <input 
            v-model="taskName"
            type="text"
            placeholder="Enter task name"
            class="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-text-muted focus:border-pomodo-orange focus:outline-none transition-colors"
          />
        </div>

        <!-- Category -->
        <div>
          <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Category
          </label>
          <select 
            v-model="selectedCategory"
            class="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-white focus:border-pomodo-orange focus:outline-none transition-colors appearance-none cursor-pointer"
          >
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            <option value="new">+ Add New Category</option>
          </select>
        </div>

        <!-- Estimated Pomodoros -->
        <div>
          <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Estimated Pomodoros
          </label>
          <div class="flex items-center gap-4 bg-dark-surface rounded-lg px-3 py-2 w-fit">
            <button 
              @click="estimatedPomodoros = Math.max(1, estimatedPomodoros - 1)"
              class="w-8 h-8 flex items-center justify-center text-pomodo-orange hover:bg-dark-border rounded transition-colors"
            >
              <Minus :size="16" />
            </button>
            <span class="text-white min-w-[40px] text-center font-medium">{{ estimatedPomodoros }}</span>
            <button 
              @click="estimatedPomodoros++"
              class="w-8 h-8 flex items-center justify-center text-pomodo-orange hover:bg-dark-border rounded transition-colors"
            >
              <Plus :size="16" />
            </button>
          </div>
        </div>

        <!-- Schedule For -->
        <div>
          <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Schedule For
          </label>
          <input 
            v-model="scheduleDate"
            type="datetime-local"
            class="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-white focus:border-pomodo-orange focus:outline-none transition-colors"
          />
        </div>

        <!-- Recurring Task -->
        <div class="flex items-center gap-3">
          <button 
            @click="isRecurring = !isRecurring"
            class="w-5 h-5 border-2 border-pomodo-orange rounded flex items-center justify-center"
            :class="isRecurring ? 'bg-pomodo-orange' : ''"
          >
            <Check v-if="isRecurring" :size="12" class="text-white" />
          </button>
          <label class="text-white cursor-pointer" @click="isRecurring = !isRecurring">
            Recurring Task
          </label>
        </div>

        <!-- Repeat Options (shown when recurring is checked) -->
        <div v-if="isRecurring">
          <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Repeat
          </label>
          <select 
            v-model="repeatOption"
            class="w-full px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-white focus:border-pomodo-orange focus:outline-none transition-colors appearance-none cursor-pointer"
          >
            <option v-for="option in repeatOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </div>

        <!-- Priority -->
        <div>
          <label class="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Priority
          </label>
          <div class="flex gap-2">
            <button 
              @click="priority = 'Low'"
              :class="[
                'flex-1 py-2 px-3 rounded-lg transition-all',
                priority === 'Low' 
                  ? 'bg-green-500/20 border border-green-500 text-green-500' 
                  : 'bg-dark-surface border border-dark-border text-text-muted hover:border-green-500 hover:text-green-500'
              ]"
            >
              Low
            </button>
            <button 
              @click="priority = 'Medium'"
              :class="[
                'flex-1 py-2 px-3 rounded-lg transition-all',
                priority === 'Medium' 
                  ? 'bg-pomodo-orange/20 border border-pomodo-orange text-pomodo-orange' 
                  : 'bg-dark-surface border border-dark-border text-text-muted hover:border-pomodo-orange hover:text-pomodo-orange'
              ]"
            >
              Medium
            </button>
            <button 
              @click="priority = 'High'"
              :class="[
                'flex-1 py-2 px-3 rounded-lg transition-all',
                priority === 'High' 
                  ? 'bg-pomodo-red/20 border border-pomodo-red text-pomodo-red' 
                  : 'bg-dark-surface border border-dark-border text-text-muted hover:border-pomodo-red hover:text-pomodo-red'
              ]"
            >
              High
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 mt-8">
        <button 
          @click="emit('close')"
          class="flex-1 py-3 bg-dark-surface border border-dark-border rounded-lg text-text-secondary font-semibold hover:bg-dark-border transition-colors"
        >
          Cancel
        </button>
        <button class="flex-1 py-3 bg-gradient-to-r from-pomodo-orange to-pomodo-red rounded-lg text-white font-semibold hover:opacity-90 transition-opacity">
          Create Task
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from { 
    opacity: 0;
    transform: scale(0.9);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}
</style>
