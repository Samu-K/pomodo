<script setup lang="ts">
import { TrendingUp, Clock, Target, CheckCircle } from 'lucide-vue-next'

// Sample data - you'll replace with real data
const focusTimeData = [
  { category: 'Work', color: 'bg-pomodo-orange', time: '3h 25m', percentage: 65 },
  { category: 'Study', color: 'bg-pomodo-red', time: '1h 15m', percentage: 25 },
  { category: 'Personal', color: 'bg-pomodo-gold', time: '30m', percentage: 10 }
]

const completedTasks = [
  { id: 1, name: 'Review project proposal', duration: '2h' },
  { id: 2, name: 'Email responses', duration: '45m' },
  { id: 3, name: 'Study algorithms', duration: '1h 15m' }
]

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const weekData = [60, 80, 65, 90, 70, 30, 45] // Heights as percentages

const emit = defineEmits<{
  'settings-click': []
}>()
</script>

<template>
  <div class="flex flex-col h-full bg-dark-bg">
    <div class="flex-1 overflow-y-auto px-6 py-6">
      
      <button 
        @click="emit('settings-click')"
        class="absolute right-6 w-8 h-8 flex items-center justify-center text-pomodo-orange hover:bg-dark-surface rounded-lg transition-colors"
      >
        <Settings :size="20" />
      </button>

      <!-- Header -->
      <h1 class="text-2xl font-semibold text-pomodo-orange mb-8">
        Today's Summary
      </h1>

      <!-- Focus Time Section -->
      <section class="mb-10">
        <h2 class="text-lg font-semibold text-white mb-5">Focus Time</h2>
        
        <div v-for="item in focusTimeData" :key="item.category" class="flex items-center mb-5">
          <div class="flex items-center gap-3 w-24">
            <div class="w-3 h-3 rounded-full" :class="item.color"></div>
            <span class="text-white text-sm">{{ item.category }}</span>
          </div>
          <div class="flex-1 mx-4 h-1.5 bg-dark-surface rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full transition-all duration-500" 
              :class="item.color"
              :style="`width: ${item.percentage}%`"
            ></div>
          </div>
          <span class="text-text-secondary text-sm min-w-[60px] text-right">{{ item.time }}</span>
        </div>

        <p class="text-text-muted text-center text-sm mt-6">
          8 focus sessions completed today
        </p>
      </section>

      <!-- Completed Tasks Section -->
      <section class="mb-10">
        <h2 class="text-lg font-semibold text-white mb-5">Completed Tasks</h2>
        
        <div class="space-y-3">
          <div 
            v-for="task in completedTasks" 
            :key="task.id"
            class="flex items-center justify-between p-3 bg-dark-surface rounded-lg"
          >
            <div class="flex items-center gap-3">
              <CheckCircle :size="18" class="text-green-500" />
              <span class="text-white">{{ task.name }}</span>
            </div>
            <span class="text-text-secondary text-sm">{{ task.duration }}</span>
          </div>
        </div>
      </section>

      <!-- Weekly Overview -->
      <section>
        <h2 class="text-lg font-semibold text-white mb-5">Weekly Overview</h2>
        
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-dark-surface rounded-xl p-4 text-center">
            <div class="flex justify-center mb-2">
              <Clock :size="20" class="text-pomodo-orange" />
            </div>
            <div class="text-2xl font-bold text-pomodo-orange mb-1">24h</div>
            <div class="text-xs text-text-muted">Total Focus</div>
          </div>
          
          <div class="bg-dark-surface rounded-xl p-4 text-center">
            <div class="flex justify-center mb-2">
              <Target :size="20" class="text-pomodo-red" />
            </div>
            <div class="text-2xl font-bold text-pomodo-red mb-1">87%</div>
            <div class="text-xs text-text-muted">Completion</div>
          </div>
          
          <div class="bg-dark-surface rounded-xl p-4 text-center">
            <div class="flex justify-center mb-2">
              <TrendingUp :size="20" class="text-pomodo-gold" />
            </div>
            <div class="text-2xl font-bold text-pomodo-gold mb-1">5.2</div>
            <div class="text-xs text-text-muted">Avg Sessions</div>
          </div>
        </div>
      </section>

      <!-- Week Chart Preview -->
      <section class="mt-10">
        <h2 class="text-lg font-semibold text-white mb-5">This Week</h2>
        <div class="flex justify-between items-end h-32 px-2">
          <div 
            v-for="(day, index) in weekDays" 
            :key="day"
            class="flex flex-col items-center gap-2 flex-1"
          >
            <div 
              class="w-full max-w-[30px] bg-dark-surface rounded-t-md transition-all hover:bg-pomodo-orange/20" 
              :style="`height: ${weekData[index]}%`"
            >
              <div 
                class="w-full bg-gradient-to-t from-pomodo-orange to-pomodo-red rounded-t-md" 
                :style="`height: ${Math.min(100, weekData[index] + 10)}%`"
              ></div>
            </div>
            <span class="text-xs text-text-muted">{{ day }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
