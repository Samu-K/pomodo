<script setup lang="ts">
import {
	ChevronLeft,
	Cloud,
	FileJson,
	FileSpreadsheet,
	Lock,
	Save,
	LayoutGrid,
	X,
	Trash2
} from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import ErrorBoundary from "../../components/ErrorBoundary.vue";
import ThemeEditor from "../../components/premium/ThemeEditor.vue"; // New Import
import SettingSection from "../../components/settings/SettingSection.vue";
import ShortcutRecorder from "../../components/settings/ShortcutRecorder.vue"; // New Import
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

// Timer Presets Logic
interface TimerPreset {
	name: string;
	focus: number;
	rest: number;
	interval: number;
	longRest: number;
}

const presetName = ref("");
const showPresetDialog = ref(false);

const customPresets = computed<TimerPreset[]>(() => {
	const setting = draftSettings.value.find((s) => s.key === "Timer Presets");
	if (setting?.value) {
		try {
			return JSON.parse(setting.value);
		} catch (e) {
			console.error("Failed to parse timer presets", e);
		}
	}
	return [];
});

const builtInPresets: TimerPreset[] = [
	{
		name: "Default",
		focus: 25,
		rest: 5,
		interval: 4,
		longRest: 15
	}
];

const applyPreset = (preset: TimerPreset) => {
	const map: Record<string, number> = {
		"Focus Duration": preset.focus,
		"Short Break Time": preset.rest,
		"Long Break Interval": preset.interval,
		"Long Break Time": preset.longRest
	};

	for (const [key, value] of Object.entries(map)) {
		const setting = draftSettings.value.find((s) => s.key === key);
		if (setting) {
			setting.value = String(value);
		}
	}
	checkForChanges();
};

const handleSavePreset = () => {
	if (!presetName.value.trim()) return;

	const getVal = (key: string) =>
		Number(draftSettings.value.find((s) => s.key === key)?.value || 0);

	const newPreset: TimerPreset = {
		name: presetName.value.trim(),
		focus: getVal("Focus Duration"),
		rest: getVal("Short Break Time"),
		interval: getVal("Long Break Interval"),
		longRest: getVal("Long Break Time")
	};

	const presetsSetting = draftSettings.value.find(
		(s) => s.key === "Timer Presets"
	);
	if (presetsSetting) {
		const updatedPresets = [...customPresets.value, newPreset];
		presetsSetting.value = JSON.stringify(updatedPresets);
		checkForChanges();
	}

	presetName.value = "";
	showPresetDialog.value = false;
};

const deletePreset = (index: number) => {
	const presetsSetting = draftSettings.value.find(
		(s) => s.key === "Timer Presets"
	);
	if (presetsSetting) {
		const updatedPresets = [...customPresets.value];
		updatedPresets.splice(index, 1);
		presetsSetting.value = JSON.stringify(updatedPresets);
		checkForChanges();
	}
};
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
      <div class="flex items-center gap-3">
        <button 
          v-if="hasUnsavedChanges"
          @click="discardChanges"
          class="w-9 h-9 flex items-center justify-center bg-pomodo-red text-black hover:opacity-90 rounded-lg transition-all shadow-sm"
          title="Discard Changes"
        >
          <Trash2 :size="18" />
        </button>
        <button 
          @click="saveChanges"
          :disabled="!hasUnsavedChanges"
          class="px-2 py-1 h-9 flex items-center rounded-lg font-semibold transition-all"
          :class="hasUnsavedChanges 
            ? 'bg-gradient-to-r from-pomodo-orange to-pomodo-red text-white hover:opacity-90' 
            : 'bg-light-surface dark:bg-dark-surface text-lightText-muted dark:text-text-muted cursor-not-allowed'"
        >
          Save Changes
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-6 py-6">
      <ErrorBoundary v-for="section of settingSections" :key="section.sectionTitle">
        <SettingSection 
          :settings="section.settings" 
          :section-title="section.sectionTitle"
          @change="handleSettingChange"
        >
          <template v-if="section.sectionTitle.toLowerCase() === 'timer'" #header-actions>
            <v-menu location="bottom end" :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <button 
                  v-bind="props"
                  class="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-pomodo-orange bg-pomodo-orange/10 border border-pomodo-orange/20 rounded hover:bg-pomodo-orange/20 transition-colors uppercase tracking-wider"
                >
                  <LayoutGrid :size="12" />
                  Presets
                </button>
              </template>
              <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-xl min-w-[200px] py-1 mt-1 overflow-hidden">
                <!-- Built-in -->
                <div class="px-3 py-1.5 text-[10px] font-bold text-lightText-muted dark:text-text-muted uppercase tracking-widest bg-light-bg/50 dark:bg-dark-bg/50">
                  Built-in
                </div>
                <button 
                  v-for="p in builtInPresets" 
                  :key="p.name"
                  @click="applyPreset(p)"
                  class="w-full flex items-center justify-between px-4 py-2 text-sm text-lightText-primary dark:text-white hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
                >
                  {{ p.name }}
                  <span class="text-[10px] text-lightText-muted dark:text-text-muted">{{ p.focus }}/{{ p.rest }}</span>
                </button>

                <!-- Custom -->
                <template v-if="customPresets.length > 0">
                  <div class="px-3 py-1.5 text-[10px] font-bold text-lightText-muted dark:text-text-muted uppercase tracking-widest bg-light-bg/50 dark:bg-dark-bg/50 border-t border-light-border dark:border-dark-border">
                    Custom
                  </div>
                  <div 
                    v-for="(p, i) in customPresets" 
                    :key="p.name"
                    class="group flex items-center hover:bg-light-bg dark:hover:bg-dark-bg"
                  >
                    <button 
                      @click="applyPreset(p)"
                      class="flex-1 flex items-center justify-between px-4 py-2 text-sm text-lightText-primary dark:text-white transition-colors text-left"
                    >
                      {{ p.name }}
                      <span class="text-[10px] text-lightText-muted dark:text-text-muted">{{ p.focus }}/{{ p.rest }}</span>
                    </button>
                    <button 
                      @click="deletePreset(i)"
                      class="opacity-0 group-hover:opacity-100 p-2 text-pomodo-red hover:bg-pomodo-red/10 transition-all rounded"
                    >
                      <X :size="14" />
                    </button>
                  </div>
                </template>

                <div class="border-t border-light-border dark:border-dark-border mt-1 pt-1">
                  <button 
                    @click="showPresetDialog = true"
                    class="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-pomodo-orange hover:bg-pomodo-orange/5 transition-colors"
                  >
                    <Save :size="14" />
                    Save current as preset
                  </button>
                </div>
              </div>
            </v-menu>
          </template>
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

      <!-- Shortcuts Settings -->
      <section class="mb-8">
        <h2 class="text-xs font-semibold text-pomodo-orange uppercase tracking-wider mb-4">
          Shortcuts
        </h2>
        
        <div class="flex items-center justify-between py-4 border-b border-light-border dark:border-dark-border">
          <div class="flex-1 mr-4">
           <!-- Label is handled inside recorder or we can hide it here and let recorder handle it -->
           <!-- Actually user asked for "Pause Timer" and then the box. Recorder has label prop but let's conform to design -->
          </div>
          <div class="w-full">
             <div v-for="setting in draftSettings.filter(s => s.key === 'Toggle Timer')" :key="setting.id">
                <ShortcutRecorder
                    data-testid="shortcut-recorder-toggle-timer"
                    label="Pause Timer"
                    v-model="setting.value"
                    @update:model-value="checkForChanges"
                />
             </div>
          </div>
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
          <div class="relative group">
            <button
              disabled
              class="flex items-center gap-2 px-3 py-2 bg-pomodo-orange/50 text-white/50 rounded-lg cursor-not-allowed whitespace-nowrap"
            >
              <Cloud :size="16" />
              <span>Sync to cloud</span>
            </button>
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              Coming Soon
            </div>
          </div>
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

    <!-- Save Preset Dialog -->
    <v-dialog v-model="showPresetDialog" max-width="400">
      <div class="bg-light-surface dark:bg-dark-surface p-6 rounded-xl border border-light-border dark:border-dark-border shadow-2xl">
        <h3 class="text-lg font-bold text-lightText-primary dark:text-white mb-2">Save Timer Preset</h3>
        <p class="text-sm text-lightText-muted dark:text-text-muted mb-4">Give your preset a name to quickly apply these settings later.</p>
        
        <v-text-field
          v-model="presetName"
          label="Preset Name"
          variant="outlined"
          density="comfortable"
          color="primary"
          autofocus
          @keyup.enter="handleSavePreset"
          hide-details
          class="mb-6"
        ></v-text-field>

        <div class="flex justify-end gap-3">
          <button 
            @click="showPresetDialog = false"
            class="px-4 py-2 text-sm font-semibold text-lightText-muted dark:text-text-muted hover:text-lightText-primary dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="handleSavePreset"
            :disabled="!presetName.trim()"
            class="px-4 py-2 bg-gradient-to-r from-pomodo-orange to-pomodo-red text-white text-sm font-bold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Save Preset
          </button>
        </div>
      </div>
    </v-dialog>
  </div>
</template>
