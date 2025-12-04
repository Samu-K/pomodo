<script setup lang="ts">
import { computed, onMounted } from "vue";
import ErrorBoundary from "../../components/ErrorBoundary.vue";
import SettingSection from "../../components/settings/SettingSection.vue";
import type { Setting } from "../../funcs/commands";
import { useSettingsStore } from "../../stores/settings";

interface SectionSettingProps {
	sectionTitle: string;
	settings: Array<Setting>;
}

const settingsStore = useSettingsStore();

onMounted(() => {
	settingsStore.fetchSettings();
});

const settingSections = computed<SectionSettingProps[]>(() => {
	if (
		settingsStore.categories.length === 0 ||
		settingsStore.settings.length === 0
	) {
		return [];
	}

	let sections: SectionSettingProps[] = [];
	for (const category of settingsStore.categories) {
		const sectionTitle = category.name;
		const settings = settingsStore.settings.filter(
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

const themeOptions = ["dark", "light"];
</script>

<template>
  <div class="flex flex-col h-full bg-light-bg dark:bg-dark-bg">
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
        <div class="flex items-center justify-between py-4 border-b border-light-border dark:border-dark-border">
          <div class="flex-1">
            <h3 class="text-lightText-primary dark:text-white font-medium">Theme</h3>
            <p class="text-xs text-lightText-muted dark:text-text-muted mt-1">Choose your preferred theme</p>
          </div>
          <v-select
            v-model="settingsStore.theme"
            :items="themeOptions"
            @update:model-value="(value) => settingsStore.setTheme(value as 'light' | 'dark')"
            density="compact"
            variant="outlined"
            hide-details
            color="primary"
            max-width="120"
          >
            <template v-slot:selection="{ item }">
              {{ item.value.charAt(0).toUpperCase() + item.value.slice(1) }}
            </template>
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props" :title="item.value.charAt(0).toUpperCase() + item.value.slice(1)" />
            </template>
          </v-select>
        </div>
      </section>
    </div>
  </div>
</template>
