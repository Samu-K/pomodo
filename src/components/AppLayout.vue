<script setup lang="ts">
import { Timer, Calendar, ListTodo, BarChart3, Settings, ChevronLeft } from 'lucide-vue-next'

interface Props {
  showHeader?: boolean
  headerTitle?: string
  showBackButton?: boolean
  showSettingsButton?: boolean
  activeTab?: 'timer' | 'timeline' | 'tasks' | 'stats'
}

const props = withDefaults(defineProps<Props>(), {
  showHeader: true,
  headerTitle: 'Pomodo',
  showBackButton: false,
  showSettingsButton: true,
  activeTab: 'timer'
})

const emit = defineEmits<{
  'nav-click': [tab: 'timer' | 'timeline' | 'tasks' | 'stats']
  'settings-click': []
  'back-click': []
}>()
</script>

<template>
  <div class="flex flex-col h-screen bg-dark-bg">
    <!-- Header -->
    <header v-if="showHeader" class="h-8 flex items-center justify-center relative px-6 border-dark-border">
      <button 
        v-if="showBackButton"
        @click="emit('back-click')"
        class="absolute left-6 w-8 h-8 flex items-center justify-center text-pomodo-orange hover:bg-dark-surface rounded-lg transition-colors"
      >
        <ChevronLeft :size="20" />
      </button>
      
      <button 
        v-if="showSettingsButton"
        @click="emit('settings-click')"
        class="absolute right-6 w-12 h-12 flex items-center justify-center text-pomodo-orange hover:bg-dark-surface rounded-lg transition-colors"
      >
        <Settings :size="20" />
      </button>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
      <slot />
    </main>

    <!-- Bottom Navigation -->
    <nav class="h-20 bg-dark-pure border-t border-dark-border">
      <div class="h-full flex items-center justify-around px-4">
        <button 
          @click="emit('nav-click', 'timer')"
          :class="[
            'flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors',
            activeTab === 'timer' ? 'text-pomodo-orange' : 'text-text-muted hover:text-text-secondary'
          ]"
        >
          <Timer :size="24" />
          <span class="text-xs font-medium">Timer</span>
        </button>
        
        <button 
          @click="emit('nav-click', 'timeline')"
          :class="[
            'flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors',
            activeTab === 'timeline' ? 'text-pomodo-orange' : 'text-text-muted hover:text-text-secondary'
          ]"
        >
          <Calendar :size="24" />
          <span class="text-xs font-medium">Timeline</span>
        </button>
        
        <button 
          @click="emit('nav-click', 'tasks')"
          :class="[
            'flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors',
            activeTab === 'tasks' ? 'text-pomodo-orange' : 'text-text-muted hover:text-text-secondary'
          ]"
        >
          <ListTodo :size="24" />
          <span class="text-xs font-medium">Tasks</span>
        </button>
        
        <button 
          @click="emit('nav-click', 'stats')"
          :class="[
            'flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors',
            activeTab === 'stats' ? 'text-pomodo-orange' : 'text-text-muted hover:text-text-secondary'
          ]"
        >
          <BarChart3 :size="24" />
          <span class="text-xs font-medium">Stats</span>
        </button>

      </div>
    </nav>
  </div>
</template>
