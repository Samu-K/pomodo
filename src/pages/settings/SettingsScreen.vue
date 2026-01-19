<script setup lang="ts">
<<<<<<< HEAD
import {
	ChevronLeft,
	Cloud,
	FileJson,
	FileSpreadsheet,
	LayoutGrid,
	Loader2,
	Lock,
	Save,
	Trash2,
	X
} from "lucide-vue-next";
import { storeToRefs } from "pinia"; // New Import
=======
import { ChevronLeft, Trash2 } from "lucide-vue-next";
>>>>>>> feature
import { computed, onMounted, ref, watch } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import ErrorBoundary from "../../components/ErrorBoundary.vue";
import SettingSection from "../../components/settings/SettingSection.vue";
import ConfirmationModal from "../../components/ui/ConfirmationModal.vue";
import type { Setting } from "../../funcs/commands";
<<<<<<< HEAD
import { exportUserData } from "../../funcs/export";
import { useAuthStore } from "../../stores/auth"; // New Import
=======
>>>>>>> feature
import { useSettingsStore } from "../../stores/settings";
import AppearanceSettings from "./components/AppearanceSettings.vue";
import DataManagement from "./components/DataManagement.vue";
import ICalSettings from "./components/ICalSettings.vue";
import ShortcutSettings from "./components/ShortcutSettings.vue";
import TimerPresets from "./components/TimerPresets.vue";

const router = useRouter();
const settingsStore = useSettingsStore();
const draftSettings = ref<Setting[]>([]);
const hasUnsavedChanges = ref(false);
const showUnsavedChangesModal = ref(false);
const pendingRoute = ref<string | null>(null);

<<<<<<< HEAD
const authStore = useAuthStore();
const { isAuthenticated } = storeToRefs(authStore);
const isSyncing = ref(false);
const showRestoreConfirmation = ref(false);

const handleSync = async () => {
	isSyncing.value = true;
	try {
		await authStore.syncNow();
		console.log("Sync complete");
		uiStore.showSuccess("Sync successful");
	} catch (e) {
		uiStore.setError(`Sync failed: ${e}`);
	} finally {
		isSyncing.value = false;
	}
};

const handleRestore = () => {
	showRestoreConfirmation.value = true;
};

const executeRestore = async () => {
	showRestoreConfirmation.value = false;
	isSyncing.value = true;
	try {
		await authStore.restore();
		console.log("Restore complete");
		uiStore.showSuccess("Restore successful");

		// Reload settings
		await settingsStore.fetchSettings();
	} catch (e) {
		uiStore.setError(`Restore failed: ${e}`);
	} finally {
		isSyncing.value = false;
	}
};

// Initialize drafts when store data is available
=======
>>>>>>> feature
watch(
	() => settingsStore.settings,
	(ns) => {
		draftSettings.value = JSON.parse(JSON.stringify(ns));
	},
	{ deep: true, immediate: true }
);
onMounted(() => settingsStore.fetchSettings());

const settingSections = computed(() => {
	if (settingsStore.categories.length === 0 || draftSettings.value.length === 0)
		return [];
	return settingsStore.categories.map((cat) => ({
		sectionTitle: cat.name,
		settings: draftSettings.value.filter((s) => s.category_id === cat.id)
	}));
});

const handleSettingChange = (
	idOrKey: number | string,
	value: string | number | boolean
) => {
	const idx =
		typeof idOrKey === "number"
			? draftSettings.value.findIndex((s) => s.id === idOrKey)
			: draftSettings.value.findIndex((s) => s.key === idOrKey);
	if (idx !== -1) {
		draftSettings.value[idx].value =
			typeof value === "boolean" ? (value ? "true" : "false") : String(value);
		hasUnsavedChanges.value =
			JSON.stringify(draftSettings.value) !==
			JSON.stringify(settingsStore.settings);
	}
};

const saveChanges = async () => {
	for (const s of draftSettings.value) {
		const orig = settingsStore.settings.find((o) => o.id === s.id);
		if (orig && orig.value !== s.value)
			await settingsStore.updateSetting(s.id, s.value);
	}
	hasUnsavedChanges.value = false;
	if (pendingRoute.value) router.push(pendingRoute.value);
};

const discardChanges = () => {
	draftSettings.value = JSON.parse(JSON.stringify(settingsStore.settings));
	hasUnsavedChanges.value = false;
	if (pendingRoute.value) router.push(pendingRoute.value);
};

onBeforeRouteLeave((to, _f, next) => {
	if (hasUnsavedChanges.value) {
		pendingRoute.value = to.fullPath;
		showUnsavedChangesModal.value = true;
		next(false);
	} else next();
});

defineExpose({
	hasUnsavedChanges,
	showUnsavedChangesModal,
	saveChanges,
	discardChanges
});
</script>

<template>
  <div class="flex flex-col h-full bg-light-bg dark:bg-dark-bg relative">
    <div class="flex items-center justify-between px-6 py-4 border-b border-light-border dark:border-dark-border">
      <div class="flex items-center gap-2">
        <button data-testid="settings-back" @click="router.back()" class="w-8 h-8 flex items-center justify-center text-pomodo-orange hover:bg-light-surface dark:hover:bg-dark-surface rounded-lg transition-colors">
          <ChevronLeft :size="24" />
        </button>
        <h1 class="text-xl font-bold text-lightText-primary dark:text-white">Settings</h1>
      </div>
      <div class="flex items-center gap-3">
        <button v-if="hasUnsavedChanges" @click="discardChanges" class="w-9 h-9 flex items-center justify-center bg-pomodo-red text-black hover:opacity-90 rounded-lg transition-all shadow-sm" title="Discard Changes">
          <Trash2 :size="18" />
        </button>
        <button @click="saveChanges" :disabled="!hasUnsavedChanges" class="px-2 py-1 h-9 flex items-center rounded-lg font-semibold transition-all" :class="hasUnsavedChanges ? 'bg-gradient-to-r from-pomodo-orange to-pomodo-red text-white hover:opacity-90' : 'bg-light-surface dark:bg-dark-surface text-lightText-muted dark:text-text-muted cursor-not-allowed'">Save Changes</button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-6 py-6">
      <ErrorBoundary v-for="section of settingSections" :key="section.sectionTitle">
        <SettingSection :settings="section.settings" :section-title="section.sectionTitle" @change="handleSettingChange">
          <template v-if="section.sectionTitle.toLowerCase() === 'timer'" #header-actions>
            <TimerPresets :settings="draftSettings" @update-setting="handleSettingChange" @change="hasUnsavedChanges = true" />
          </template>
        </SettingSection>
      </ErrorBoundary>

<<<<<<< HEAD
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
        
        <div class="py-4 border-b border-light-border dark:border-dark-border">
          <div class="flex items-center justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lightText-primary dark:text-white font-medium">Cloud Sync</h3>
              <p class="text-xs text-lightText-muted dark:text-text-muted mt-1">
                  {{ authStore.lastSyncTime ? `Last sync: ${authStore.lastSyncTime}` : (isAuthenticated ? "Signed in with Supabase" : "Sign in to sync your data") }}
              </p>
            </div>

          </div>
          
          <div class="flex gap-3">
            <template v-if="!isAuthenticated">
                 <button
                    @click="router.push('/auth')"
                    class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-pomodo-orange text-white rounded-lg hover:opacity-90 transition-all font-semibold text-sm"
                 >
                    <Cloud :size="16" />
                    <span>Sign In</span>
                 </button>
            </template>
            <template v-else>
                 <button
                    @click="handleRestore"
                    :disabled="isSyncing"
                    class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-lightText-primary dark:text-white rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-all text-sm"
                    :class="{ 'opacity-50 cursor-not-allowed': isSyncing }"
                 >
                    <Cloud :size="16" />
                    <span>Restore</span>
                 </button>
                 <button
                    @click="handleSync"
                    :disabled="isSyncing"
                    class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-pomodo-orange text-white rounded-lg hover:opacity-90 transition-all text-sm font-semibold"
                    :class="{ 'opacity-50 cursor-not-allowed': isSyncing }"
                 >
                    <Cloud :size="16" v-if="!isSyncing" />
                    <Loader2 :size="16" v-else class="animate-spin" />
                    <span>{{ isSyncing ? "Syncing..." : "Sync Now" }}</span>
                 </button>
            </template>
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

    <!-- Restore Confirmation Modal -->
    <ConfirmationModal 
      v-if="showRestoreConfirmation"
      title="Restore Backup"
      message="This will overwrite your local data with the latest cloud backup. Are you sure you want to proceed?"
      primaryBtnText="Restore"
      secondaryBtnText="Cancel"
      :isDanger="true"
      @primary="executeRestore"
      @secondary="showRestoreConfirmation = false"
      @close="showRestoreConfirmation = false"
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
=======
      <AppearanceSettings />
      <ShortcutSettings :draftSettings="draftSettings" @change="hasUnsavedChanges = true" />
      <ICalSettings :settings="draftSettings" :is-premium="settingsStore.isPremium" @update-setting="handleSettingChange" @save-all="saveChanges" @change="hasUnsavedChanges = true" />
      <DataManagement />
    </div>

    <ConfirmationModal v-if="showUnsavedChangesModal" title="Unsaved Changes" message="You have unsaved changes. Save before leaving?" primaryBtnText="Save Changes" secondaryBtnText="Discard Changes" @primary="saveChanges" @secondary="discardChanges" @close="showUnsavedChangesModal = false; pendingRoute = null" />
>>>>>>> feature
  </div>
</template>

