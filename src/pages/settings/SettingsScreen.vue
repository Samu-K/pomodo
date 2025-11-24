<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { Minus, Plus } from "lucide-vue-next";
import { computed, type Ref, ref, watchEffect } from "vue";
import SettingBox from "../../components/settings/SettingBox.vue";
import SettingSection from "../../components/settings/SettingSection.vue";
import { SettingRef } from "../../defines/settings.ts";
import {
	get_settings,
	get_settings_categories
} from "../../funcs/db/settings.ts";

interface SectionSettingProps {
	sectionTitle: string;
	settings: Array<SettingRef>;
}

const settingsStatus = useQuery({
	queryKey: ["settings"],
	queryFn: get_settings
});
const settingCategories = useQuery({
	queryKey: ["setting_categories"],
	queryFn: get_settings_categories
});

const settingSections = computed<SectionSettingProps[]>(() => {
	if (!settingsStatus.isSuccess || !settingCategories.isSuccess) {
		return [];
	}
	if (!settingsStatus.data.value || !settingCategories.data.value) {
		return [];
	}

	for (const category of settingCategories.data.value) {
		let newSection: SectionSettingProps;
		newSection.sectionTitle = category.name;

		// get all setting of category
	}
});

watchEffect(() => {
	console.log("Settings data", settingsStatus.data.value);
	console.log("Cat data", settingCategories.data.value);
});

// Sample settings data - you'll connect to real state
const timerSettings = {
	focusDuration: 25,
	shortBreak: 5,
	longBreak: 15
};

const automationSettings = {
	autoStartBreaks: false,
	autoStartFocus: true
};

const notificationSettings = {
	soundAlerts: true,
	vibration: true,
	pushNotifications: false
};

const autoStartBreaks = ref(true);
const autoStartFocus = ref(false);
const soundAlerts = ref(true);
const vibration = ref(true);
const pushNotif = ref(false);

const focusDuration = ref(25);

const themeOptions = ["Dark", "Light", "Auto"];
const accentColors = ["#b8744f", "#c75450", "#d4a373", "#4ade80"];

interface Switch {
	label: string;
	sublabel: string;
	modelValue: Ref<boolean>;
}

const switches: Array<Switch> = [
	{
		label: "Auto-start Breaks",
		sublabel: "Start break when focus ends",
		modelValue: ref(false)
	},
	{
		label: "Auto-start Focus",
		sublabel: "Start focus when break ends",
		modelValue: ref(true)
	}
];
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
        <div class="flex items-center justify-between mt-2">
          <div flex="flex flex-col">
            <p class="text-white font-medium">Focus duration</p>
            <p class="text-xs text-text-muted">Lenght of focus session</p>
          </div>
          <v-number-input
            :reverse="false"
            controlVariant="split"
            :model-value="focusDuration"
            :hideInput="false"
            :inset="false"
            variant="solo-filled"
            max-width="35%"
          ></v-number-input>
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
      <SettingSection section-title="Automation" :settings="switches"/>

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
