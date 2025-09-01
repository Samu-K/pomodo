<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus } from 'lucide-vue-next'

const emit = defineEmits<{
  'add-task': []
}>()

// Sample data
const timeSlots = ['9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00']

const tasks = [
  {
    id: 1,
    title: 'Project Review',
    category: 'Work',
    pomodoros: 4,
    startTime: 0,
    duration: 115,
    gradient: 'from-pomodo-orange to-pomodo-red'
  },
  {
    id: 2,
    title: 'Email Responses',
    category: 'Work',
    pomodoros: 2,
    startTime: 130,
    duration: 58,
    gradient: 'from-pomodo-red to-pomodo-gold'
  },
  {
    id: 3,
    title: 'Algorithm Study',
    category: 'Study',
    pomodoros: 4,
    startTime: 256,
    duration: 115,
    gradient: 'from-pomodo-gold to-pomodo-orange'
  },
  {
    id: 4,
    title: 'Code Review',
    category: 'Work',
    pomodoros: 2,
    startTime: 386,
    duration: 58,
    gradient: 'from-pomodo-orange to-pomodo-red'
  }
]

// Current time indicator position (in pixels from top)
const currentTimePosition = 200
</script>

<template>
  <div class="flex flex-col h-full bg-dark-bg relative">
    <!-- Header with Date Navigation -->
    <div class="px-6 py-4 border-b border-dark-border">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button class="w-8 h-8 rounded-full border border-pomodo-orange text-pomodo-orange hover:bg-pomodo-orange hover:text-white transition-colors flex items-center justify-center">
            <ChevronLeft :size="16" />
          </button>
          <span class="text-lg font-semibold text-pomodo-orange">Today, Sep 1</span>
          <button class="w-8 h-8 rounded-full border border-pomodo-orange text-pomodo-orange hover:bg-pomodo-orange hover:text-white transition-colors flex items-center justify-center">
            <ChevronRight :size="16" />
          </button>
        </div>
        <button class="text-pomodo-orange hover:text-pomodo-gold transition-colors">
          <span class="text-sm">Week View</span>
        </button>
      </div>
    </div>

    <!-- Timeline Grid -->
    <div class="flex-1 overflow-auto">
      <div class="flex h-full">
        <!-- Time Column -->
        <div class="w-16 flex-shrink-0 border-r border-dark-border">
          <div 
            v-for="time in timeSlots" 
            :key="time"
            class="h-16 flex items-center justify-center text-xs text-text-muted border-b border-dark-border"
          >
            {{ time }}
          </div>
        </div>

        <!-- Tasks Column -->
        <div class="flex-1 relative">
          <!-- Grid Lines -->
          <div 
            v-for="(_, index) in timeSlots" 
            :key="index"
            class="absolute w-full h-16 border-b border-dark-border" 
            :style="`top: ${index * 64}px`"
          ></div>

          <!-- Task Blocks -->
          <div 
            v-for="task in tasks"
            :key="task.id"
            class="absolute left-4 right-4 rounded-lg p-3 cursor-pointer hover:scale-[1.02] transition-transform shadow-lg"
            :class="`bg-gradient-to-br ${task.gradient}`"
            :style="`top: ${task.startTime}px; height: ${task.duration}px;`"
          >
            <h3 class="text-white font-semibold text-sm">{{ task.title }}</h3>
            <p class="text-white/80 text-xs mt-1">{{ task.pomodoros }} pomodoros • {{ task.category }}</p>
            <div v-if="task.pomodoros > 2" class="flex gap-1 mt-2">
              <div 
                v-for="i in task.pomodoros" 
                :key="i"
                class="w-2 h-2 rounded-full bg-white/30"
              ></div>
            </div>
          </div>

          <!-- Current Time Indicator -->
          <div 
            class="absolute left-0 right-0 flex items-center" 
            :style="`top: ${currentTimePosition}px;`"
          >
            <div class="w-3 h-3 bg-pomodo-red rounded-full"></div>
            <div class="flex-1 h-0.5 bg-pomodo-red"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Action Button -->
    <button 
      @click="emit('add-task')"
      class="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-pomodo-orange to-pomodo-red rounded-full text-white shadow-fab hover:shadow-fab-hover hover:scale-110 transition-all flex items-center justify-center"
    >
      <Plus :size="24" />
    </button>

    <!-- Quick Stats Bar -->
    <div class="px-6 py-3 bg-dark-pure border-t border-dark-border">
      <div class="flex justify-around text-xs">
        <div class="text-center">
          <span class="text-text-muted block">Scheduled</span>
          <span class="text-pomodo-orange font-semibold">12 tasks</span>
        </div>
        <div class="text-center">
          <span class="text-text-muted block">Total Time</span>
          <span class="text-pomodo-red font-semibold">7h 30m</span>
        </div>
        <div class="text-center">
          <span class="text-text-muted block">Completed</span>
          <span class="text-green-500 font-semibold">5/12</span>
        </div>
      </div>
    </div>
  </div>
</template>
