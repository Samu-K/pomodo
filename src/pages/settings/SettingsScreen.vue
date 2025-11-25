<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import ErrorBoundary from "../../components/ErrorBoundary.vue";
import SettingSection from "../../components/settings/SettingSection.vue";
import { Setting } from "../../defines/settings.ts";
import {
	get_settings,
	get_settings_categories
} from "../../funcs/db/settings.ts";

interface SectionSettingProps {
	sectionTitle: string;
	settings: Array<Setting>;
}

const settingCategories = useQuery({
	queryKey: ["setting_categories"],
	queryFn: get_settings_categories
});
const settingState = useQuery({
	queryKey: ["settings"],
	queryFn: get_settings
});

const settingSections = computed<SectionSettingProps[]>(() => {
	if (!settingCategories.isSuccess || !settingState.isSuccess) {
		return [];
	}
	if (!settingCategories.data.value || !settingState.data.value) {
		return [];
	}

	let sections: SectionSettingProps[] = [];
	for (const category of settingCategories.data.value) {
		const sectionTitle = category.name;
		const settings = settingState.data.value.filter(
			(setting) => setting.category_id === category.id
		);
		const newSection: SectionSettingProps = {
			sectionTitle: sectionTitle,
			settings: settings
		};
		sections.push(newSection);
	}

	return sections;
});

const themeOptions = ["Dark", "Light", "Auto"];
const accentColors = ["#b8744f", "#c75450", "#d4a373", "#4ade80"];
</script>

<template>
  <div class="flex flex-col h-full bg-dark-bg">
    <div class="flex-1 overflow-y-auto px-6 py-6">
      <ErrorBoundary v-for="section of settingSections">
        <SettingSection :settings="section.settings" :section-title="section.sectionTitle">
        </SettingSection>
      </ErrorBoundary>
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
