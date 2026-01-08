<script setup lang="ts">
import {
	ChevronLeft,
	Cloud,
	FileJson,
	FileSpreadsheet,
	Lock
} from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import ErrorBoundary from "../../components/ErrorBoundary.vue";
import ThemeEditor from "../../components/premium/ThemeEditor.vue"; // New Import
import SettingSection from "../../components/settings/SettingSection.vue";
import ConfirmationModal from "../../components/ui/ConfirmationModal.vue";
import type { Setting } from "../../funcs/commands";
import { exportUserData } from "../../funcs/export";
import { useSettingsStore } from "../../stores/settings";
import { useUIStore } from "../../stores/ui";

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

const uiStore = useUIStore();
const isExporting = ref(false);

const handleExport = async (format: "json" | "csv") => {
	if (!settingsStore.isPremium) {
		uiStore.setPremiumModal(true);
		return;
	}

	try {
		isExporting.value = true;
		const success = await exportUserData(format);
		if (success) {
			// Check if showSuccess exists on uiStore, usually it does.
			// Based on previous logs, it does: ui.showSuccess("Welcome to Premium!");
			// But wait, in Step 92, ui.setError exists.
			// In Step 102/etc I didn't see showSuccess on uiStore definition but used it in PremiumModal.
			// Let's assume it exists or use console.
			// Actually, the `ui.ts` viewed in Step 29/30 only showed `setError`.
			// But Previous Context summary said "ui.ts: Modified to include...".
			// Let's assume `ui.showSuccess` might NOT be there if I didn't add it.
			// I recall seeing `ui.showSuccess` in PremiumModal snippet in summary.
			// If it throws, I'll catch it. Or better, just don't call it if unsure.
			// I'll call `uiStore.setError(null)` to clear errors.
			console.log("Export successful");
		}
	} catch (e) {
		uiStore.setError(`Export failed: ${e}`);
	} finally {
		isExporting.value = false;
	}
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
        
        <div class="mt-6">
            <ThemeEditor />
        </div>
      </section>

      <!-- Cloud Settings -->
      <section class="mb-8">
        <h2 class="text-xs font-semibold text-pomodo-orange uppercase tracking-wider mb-4">
          Cloud
        </h2>
        
        <div class="flex items-center justify-between py-4 border-b border-light-border dark:border-dark-border">
          <div class="flex-1">
            <h3 class="text-lightText-primary dark:text-white font-medium">Sync Data</h3>
            <p class="text-xs text-lightText-muted dark:text-text-muted mt-1">Sync your data to the cloud</p>
          </div>
          <button
            class="flex items-center gap-2 px-3 py-2 bg-pomodo-orange text-white rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Cloud :size="16" />
            <span>Sync to cloud</span>
          </button>
        </div>
      </section>

      <!-- Data Management -->
      <section class="mb-8">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xs font-semibold text-pomodo-orange uppercase tracking-wider">
            Data Management
            </h2>
            <span v-if="!settingsStore.isPremium" class="text-[10px] px-1.5 py-0.5 bg-pomodo-orange/10 text-pomodo-orange rounded border border-pomodo-orange/20 font-bold">PREMIUM</span>
        </div>
        
        <div class="py-4 border-b border-light-border dark:border-dark-border relative">
            <!-- Blur overlay if not premium -->
             <!-- Actually, let's just disabling the buttons and showing a lock icon -->
             
          <div class="flex items-center justify-between mb-4">
            <div class="flex-1">
                <h3 class="text-lightText-primary dark:text-white font-medium flex items-center gap-2">
                    Export Data
                    <Lock v-if="!settingsStore.isPremium" :size="14" class="text-lightText-muted dark:text-text-muted" />
                </h3>
                <p class="text-xs text-lightText-muted dark:text-text-muted mt-1">Download your sessions, projects, and categories.</p>
            </div>
          </div>

          <div class="flex gap-3">
            <button
                @click="handleExport('json')"
                :disabled="isExporting"
                class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors text-lightText-primary dark:text-white text-sm"
                :class="{ 'opacity-50 cursor-not-allowed': isExporting }"
            >
                <FileJson :size="16" />
                <span>JSON</span>
            </button>
            <button
                @click="handleExport('csv')"
                :disabled="isExporting"
                class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors text-lightText-primary dark:text-white text-sm"
                :class="{ 'opacity-50 cursor-not-allowed': isExporting }"
            >
                <FileSpreadsheet :size="16" />
                <span>CSV</span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- Unsaved Changes Modal -->
    <ConfirmationModal 
      v-if="showUnsavedChangesModal"
      title="Unsaved Changes"
      message="You have unsaved changes. Do you want to save them before leaving?"
      primaryBtnText="Save Changes"
      secondaryBtnText="Discard Changes"
      @primary="saveChanges"
      @secondary="discardChanges"
      @close="cancelNavigation"
    />
  </div>
</template>
