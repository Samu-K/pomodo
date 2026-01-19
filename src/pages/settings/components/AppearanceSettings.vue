<script setup lang="ts">
import ThemeEditor from "../../../components/premium/ThemeEditor.vue";
import { useSettingsStore } from "../../../stores/settings";

const settingsStore = useSettingsStore();

const themeOptions = [
	{ value: "system", label: "Use system" },
	{ value: "dark", label: "Dark" },
	{ value: "light", label: "Light" }
];

const handleThemeChange = (value: "light" | "dark" | "system") => {
	settingsStore.setTheme(value);
};
</script>

<template>
  <section class="mb-8">
    <h2 class="text-xs font-semibold text-pomodo-orange uppercase tracking-wider mb-4">
      Appearance
    </h2>
    <div class="flex items-center justify-between py-4 border-b border-light-border dark:border-dark-border">
      <div class="flex-1">
        <h3 class="text-lightText-primary dark:text-white font-medium">Theme</h3>
        <p class="text-xs text-lightText-muted dark:text-text-muted mt-1">Choose your preferred theme</p>
      </div>
      <v-select
        data-testid="theme-selector"
        :model-value="settingsStore.theme"
        :items="themeOptions"
        item-title="label"
        item-value="value"
        @update:model-value="(value) => handleThemeChange(value as 'light' | 'dark' | 'system')"
        density="compact"
        variant="outlined"
        hide-details
        color="primary"
        max-width="150"
      >
      </v-select>
    </div>
    <div class="mt-6">
      <ThemeEditor />
    </div>
  </section>
</template>
