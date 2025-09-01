<script setup lang="ts">
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-vue-next'

// Props (if needed)
interface Props {
  initialTime?: number
  category?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialTime: 25 * 60,
  category: 'Work'
})

// Emit events (for parent communication)
const emit = defineEmits<{
  play: []
  pause: []
  reset: []
  skip: []
  categoryChange: [category: string]
}>()

// Format time for display (you'll implement this)
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="flex flex-col h-full bg-dark-bg">
    <!-- Main Timer Container -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 gap-10">
      
      <!-- Progress Ring -->
      <div class="relative w-52 h-52">
        <svg class="transform -rotate-90 w-52 h-52">
          <circle
            cx="104"
            cy="104"
            r="96"
            stroke-width="8"
            fill="none"
            class="stroke-dark-border"
          />
          <circle
            cx="104"
            cy="104"
            r="96"
            stroke-width="8"
            fill="none"
            class="stroke-pomodo-orange"
            stroke-linecap="round"
            stroke-dasharray="603.19"
            :stroke-dashoffset="150"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-10 h-10 bg-pomodo-orange rounded-full"></div>
        </div>
      </div>

      <!-- Timer Display -->
      <div class="text-timer text-pomodo-red">
        {{ formatTime(initialTime) }}
      </div>

      <!-- Category Selector -->
      <button class="relative w-64 px-5 py-4 bg-dark-surface border border-dark-border rounded-xl text-white text-center group hover:border-pomodo-orange/50 transition-colors">
        <span>{{ category }}</span>
        <svg class="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-hover:text-pomodo-orange transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Control Buttons -->
      <div class="flex items-center gap-8">
        <button 
          @click="emit('reset')"
          class="w-12 h-12 rounded-full bg-dark-surface border border-dark-border text-text-secondary hover:text-pomodo-orange hover:border-pomodo-orange/50 transition-all flex items-center justify-center"
        >
          <RotateCcw :size="20" />
        </button>
        
        <button 
          @click="emit('play')"
          class="w-20 h-20 rounded-full bg-gradient-to-br from-pomodo-orange to-pomodo-red text-white hover:scale-105 transition-transform shadow-fab hover:shadow-fab-hover flex items-center justify-center"
        >
          <Play :size="32" />
        </button>
        
        <button 
          @click="emit('skip')"
          class="w-12 h-12 rounded-full bg-dark-surface border border-dark-border text-text-secondary hover:text-pomodo-orange hover:border-pomodo-orange/50 transition-all flex items-center justify-center"
        >
          <SkipForward :size="20" />
        </button>
      </div>
    </div>

    <!-- Task Preview Bar (optional) -->
    <div class="px-6 py-4 bg-dark-pure border-t border-dark-border">
      <div class="text-text-muted text-sm text-center">
        Next: Algorithm Study (4 pomodoros)
      </div>
    </div>
  </div>
</template>
