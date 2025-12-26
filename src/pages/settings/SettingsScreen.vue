<script setup lang="ts">
import { ChevronLeft } from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import ErrorBoundary from "../../components/ErrorBoundary.vue";
import SettingSection from "../../components/settings/SettingSection.vue";
import UnsavedChangesModal from "../../components/settings/UnsavedChangesModal.vue";
import type { Setting } from "../../funcs/commands";
import { useSettingsStore } from "../../stores/settings";

interface SectionSettingProps {
	sectionTitle: string;
	settings: Array<Setting>;
}

const router = useRouter();
const settingsStore = useSettingsStore();
const draftSettings = ref<Setting[]>([]);
const hasUnsavedChanges = ref(false);
const showUnsavedChangesModal = ref(false);
const pendingRoute = ref<string | null>(null);

// Initialize drafts when store data is available
watch(
	() => settingsStore.settings,
	(newSettings) => {
		draftSettings.value = JSON.parse(JSON.stringify(newSettings));
	},
	{ deep: true, immediate: true }
);

onMounted(() => {
	settingsStore.fetchSettings();
});

const settingSections = computed<SectionSettingProps[]>(() => {
	if (
		settingsStore.categories.length === 0 ||
		draftSettings.value.length === 0
	) {
		return [];
	}

	let sections: SectionSettingProps[] = [];
	for (const category of settingsStore.categories) {
		const sectionTitle = category.name;
		const settings = draftSettings.value.filter(
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

const themeOptions = [
	{ value: "system", label: "Use system" },
	{ value: "dark", label: "Dark" },
	{ value: "light", label: "Light" }
];

const handleSettingChange = (id: number, value: string | number | boolean) => {
	const settingIndex = draftSettings.value.findIndex((s) => s.id === id);
	if (settingIndex !== -1) {
		let stringValue = "";
		if (typeof value === "boolean") {
			stringValue = value ? "true" : "false";
		} else {
			stringValue = String(value);
		}
		draftSettings.value[settingIndex].value = stringValue;
		checkForChanges();
	}
};

const handleThemeChange = (value: "light" | "dark" | "system") => {
	settingsStore.setTheme(value);
};

const checkForChanges = () => {
	const settingsChanged =
		JSON.stringify(draftSettings.value) !==
		JSON.stringify(settingsStore.settings);
	hasUnsavedChanges.value = settingsChanged;
};

const saveChanges = async () => {
	// Save all changed settings
	for (const setting of draftSettings.value) {
		const originalSetting = settingsStore.settings.find(
			(s) => s.id === setting.id
		);
		if (originalSetting && originalSetting.value !== setting.value) {
			await settingsStore.updateSetting(setting.id, setting.value);
		}
	}

	hasUnsavedChanges.value = false;

	if (pendingRoute.value) {
		const route = pendingRoute.value;
		pendingRoute.value = null;
		showUnsavedChangesModal.value = false;
		router.push(route);
	}
};

const discardChanges = () => {
	draftSettings.value = JSON.parse(JSON.stringify(settingsStore.settings));
	hasUnsavedChanges.value = false;

	if (pendingRoute.value) {
		const route = pendingRoute.value;
		pendingRoute.value = null;
		showUnsavedChangesModal.value = false;
		router.push(route);
	}
};

const cancelNavigation = () => {
	showUnsavedChangesModal.value = false;
	pendingRoute.value = null;
};

onBeforeRouteLeave((to, _from, next) => {
	if (hasUnsavedChanges.value) {
		pendingRoute.value = to.fullPath;
		showUnsavedChangesModal.value = true;
		next(false);
	} else {
		next();
	}
});
</script>

<template>
  <div class="flex flex-col h-full bg-light-bg dark:bg-dark-bg relative">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-light-border dark:border-dark-border">
      <div class="flex items-center gap-2">
        <button 
          data-testid="settings-back"
          @click="router.back()"
          class="w-8 h-8 flex items-center justify-center text-pomodo-orange hover:bg-light-surface dark:hover:bg-dark-surface rounded-lg transition-colors"
        >
          <ChevronLeft :size="24" />
        </button>
        <h1 class="text-xl font-bold text-lightText-primary dark:text-white">Settings</h1>
      </div>
      <button 
        @click="saveChanges"
        :disabled="!hasUnsavedChanges"
        class="px-2 py-1 rounded-lg font-semibold transition-all"
        :class="hasUnsavedChanges 
          ? 'bg-gradient-to-r from-pomodo-orange to-pomodo-red text-white hover:opacity-90' 
          : 'bg-light-surface dark:bg-dark-surface text-lightText-muted dark:text-text-muted cursor-not-allowed'"
      >
        Save Changes
      </button>
    </div>

    <div class="flex-1 overflow-y-auto px-6 py-6">
      <ErrorBoundary v-for="section of settingSections">
        <SettingSection 
          :settings="section.settings" 
          :section-title="section.sectionTitle"
          @change="handleSettingChange"
        >
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
      </section>
    </div>

    <!-- Unsaved Changes Modal -->
    <UnsavedChangesModal 
      v-if="showUnsavedChangesModal"
      @save="saveChanges"
      @discard="discardChanges"
      @cancel="cancelNavigation"
    />
  </div>
</template>
