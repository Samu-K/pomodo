<script setup lang="ts">
import { Minus, Plus } from 'lucide-vue-next'

// Sample settings data - you'll connect to real state
const timerSettings = {
  focusDuration: 25,
  shortBreak: 5,
  longBreak: 15
}

const automationSettings = {
  autoStartBreaks: true,
  autoStartFocus: false
}

const notificationSettings = {
  soundAlerts: true,
  vibration: true,
  pushNotifications: false
}

const themeOptions = ['Dark', 'Light', 'Auto']
const accentColors = ['#b8744f', '#c75450', '#d4a373', '#4ade80']
</script>

<template>
  <div class="flex flex-col h-full bg-dark-bg">
    <div class="flex-1 overflow-y-auto px-6 py-6">
      
      <!-- Timer Settings -->
      <section class="mb-8">
        <h2 class="text-xs font-semibold text-pomodo-orange uppercase tracking-wider mb-4">
          Timer Settings
        </h2>
        
        <!-- Focus Duration -->
        <div class="flex items-center justify-between py-4 border-b border-dark-border">
          <div class="flex-1">
            <h3 class="text-white font-medium">Focus Duration</h3>
            <p class="text-xs text-text-muted mt-1">Length of focus sessions</p>
          </div>
          <div class="flex items-center gap-3 bg-dark-surface rounded-lg px-2 py-1">
            <button class="w-8 h-8 flex items-center justify-center text-pomodo-orange hover:bg-dark-border rounded transition-colors">
              <Minus :size="16" />
            </button>
            <span class="text-white min-w-[40px] text-center">{{ timerSettings.focusDuration }}m</span>
            <button class="w-8 h-8 flex items-center justify-center text-pomodo-orange hover:bg-dark-border rounded transition-colors">
              <Plus :size="16" />
            </button>
          </div>
        </div>

        <!-- Short Break -->
        <div class="flex items-center justify-between py-4 border-b border-dark-border">
          <div class="flex-1">
            <h3 class="text-white font-medium">Short Break</h3>
            <p class="text-xs text-text-muted mt-1">Break between sessions</p>
          </div>
          <div class="flex items-center gap-3 bg-dark-surface rounded-lg px-2 py-1">
            <button class="w-8 h-8 flex items-center justify-center text-pomodo-orange hover:bg-dark-border rounded transition-colors">
              <Minus :size="16" />
            </button>
            <span class="text-white min-w-[40px] text-center">{{ timerSettings.shortBreak }}m</span>
            <button class="w-8 h-8 flex items-center justify-center text-pomodo-orange hover:bg-dark-border rounded transition-colors">
              <Plus :size="16" />
            </button>
          </div>
        </div>

        <!-- Long Break -->
        <div class="flex items-center justify-between py-4 border-b border-dark-border">
          <div class="flex-1">
            <h3 class="text-white font-medium">Long Break</h3>
            <p class="text-xs text-text-muted mt-1">Break after 4 sessions</p>
          </div>
          <div class="flex items-center gap-3 bg-dark-surface rounded-lg px-2 py-1">
            <button class="w-8 h-8 flex items-center justify-center text-pomodo-orange hover:bg-dark-border rounded transition-colors">
              <Minus :size="16" />
            </button>
            <span class="text-white min-w-[40px] text-center">{{ timerSettings.longBreak }}m</span>
            <button class="w-8 h-8 flex items-center justify-center text-pomodo-orange hover:bg-dark-border rounded transition-colors">
              <Plus :size="16" />
            </button>
          </div>
        </div>
      </section>

      <!-- Automation -->
      <section class="mb-8">
        <h2 class="text-xs font-semibold text-pomodo-orange uppercase tracking-wider mb-4">
          Automation
        </h2>
        
        <!-- Auto-start Breaks -->
        <div class="flex items-center justify-between py-4 border-b border-dark-border">
          <div class="flex-1">
            <h3 class="text-white font-medium">Auto-start Breaks</h3>
            <p class="text-xs text-text-muted mt-1">Start break when focus ends</p>
          </div>
          <button 
            :class="[
              'relative w-12 h-7 rounded-full transition-colors',
              automationSettings.autoStartBreaks ? 'bg-pomodo-orange' : 'bg-dark-surface'
            ]"
          >
            <div 
              :class="[
                'absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform',
                automationSettings.autoStartBreaks ? 'translate-x-5' : 'translate-x-0.5'
              ]"
            ></div>
          </button>
        </div>

        <!-- Auto-start Focus -->
        <div class="flex items-center justify-between py-4 border-b border-dark-border">
          <div class="flex-1">
            <h3 class="text-white font-medium">Auto-start Focus</h3>
            <p class="text-xs text-text-muted mt-1">Start next session after break</p>
          </div>
          <button 
            :class="[
              'relative w-12 h-7 rounded-full transition-colors',
              automationSettings.autoStartFocus ? 'bg-pomodo-orange' : 'bg-dark-surface'
            ]"
          >
            <div 
              :class="[
                'absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform',
                automationSettings.autoStartFocus ? 'translate-x-5' : 'translate-x-0.5'
              ]"
            ></div>
          </button>
        </div>
      </section>

      <!-- Notifications -->
      <section class="mb-8">
        <h2 class="text-xs font-semibold text-pomodo-orange uppercase tracking-wider mb-4">
          Notifications
        </h2>
        
        <!-- Sound Alerts -->
        <div class="flex items-center justify-between py-4 border-b border-dark-border">
          <div class="flex-1">
            <h3 class="text-white font-medium">Sound Alerts</h3>
            <p class="text-xs text-text-muted mt-1">Play sound when timer ends</p>
          </div>
          <button 
            :class="[
              'relative w-12 h-7 rounded-full transition-colors',
              notificationSettings.soundAlerts ? 'bg-pomodo-orange' : 'bg-dark-surface'
            ]"
          >
            <div 
              :class="[
                'absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform',
                notificationSettings.soundAlerts ? 'translate-x-5' : 'translate-x-0.5'
              ]"
            ></div>
          </button>
        </div>

        <!-- Vibration -->
        <div class="flex items-center justify-between py-4 border-b border-dark-border">
          <div class="flex-1">
            <h3 class="text-white font-medium">Vibration</h3>
            <p class="text-xs text-text-muted mt-1">Vibrate when timer ends</p>
          </div>
          <button 
            :class="[
              'relative w-12 h-7 rounded-full transition-colors',
              notificationSettings.vibration ? 'bg-pomodo-orange' : 'bg-dark-surface'
            ]"
          >
            <div 
              :class="[
                'absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform',
                notificationSettings.vibration ? 'translate-x-5' : 'translate-x-0.5'
              ]"
            ></div>
          </button>
        </div>

        <!-- Push Notifications -->
        <div class="flex items-center justify-between py-4 border-b border-dark-border">
          <div class="flex-1">
            <h3 class="text-white font-medium">Push Notifications</h3>
            <p class="text-xs text-text-muted mt-1">Notify when not in app</p>
          </div>
          <button 
            :class="[
              'relative w-12 h-7 rounded-full transition-colors',
              notificationSettings.pushNotifications ? 'bg-pomodo-orange' : 'bg-dark-surface'
            ]"
          >
            <div 
              :class="[
                'absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform',
                notificationSettings.pushNotifications ? 'translate-x-5' : 'translate-x-0.5'
              ]"
            ></div>
          </button>
        </div>
      </section>

      <!-- Theme Settings -->
      <section class="mb-8">
        <h2 class="text-xs font-semibold text-pomodo-orange uppercase tracking-wider mb-4">
          Appearance
        </h2>
        
        <!-- Theme Selection -->
        <div class="flex items-center justify-between py-4 border-b border-dark-border">
          <div class="flex-1">
            <h3 class="text-white font-medium">Theme</h3>
            <p class="text-xs text-text-muted mt-1">Choose your preferred theme</p>
          </div>
          <select class="bg-dark-surface text-white px-4 py-2 rounded-lg border border-dark-border focus:border-pomodo-orange outline-none">
            <option v-for="theme in themeOptions" :key="theme" :value="theme">{{ theme }}</option>
          </select>
        </div>

        <!-- Accent Color -->
        <div class="flex items-center justify-between py-4 border-b border-dark-border">
          <div class="flex-1">
            <h3 class="text-white font-medium">Accent Color</h3>
            <p class="text-xs text-text-muted mt-1">Customize app colors</p>
          </div>
          <div class="flex gap-2">
            <button 
              v-for="(color, index) in accentColors" 
              :key="color"
              class="w-8 h-8 rounded-full transition-transform hover:scale-110"
              :class="index === 0 ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-bg' : ''"
              :style="`background-color: ${color}`"
            ></button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
