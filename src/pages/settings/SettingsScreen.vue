<script setup lang="ts">
import { ChevronLeft, Cloud, Loader2, Trash2 } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import ErrorBoundary from "../../components/ErrorBoundary.vue";
import SettingSection from "../../components/settings/SettingSection.vue";
import ConfirmationModal from "../../components/ui/ConfirmationModal.vue";
import type { Setting } from "../../funcs/commands";
import { useAuthStore } from "../../stores/auth";
import { useSettingsStore } from "../../stores/settings";
import { useUIStore } from "../../stores/ui";

import AppearanceSettings from "./components/AppearanceSettings.vue";
import DataManagement from "./components/DataManagement.vue";
import ICalSettings from "./components/ICalSettings.vue";
import ShortcutSettings from "./components/ShortcutSettings.vue";
import TimerPresets from "./components/TimerPresets.vue";

const router = useRouter();
const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const uiStore = useUIStore();
const { isAuthenticated } = storeToRefs(authStore);

const draftSettings = ref<Setting[]>([]);
const hasUnsavedChanges = ref(false);
const showUnsavedChangesModal = ref(false);
const pendingRoute = ref<string | null>(null);

// Cloud Sync State
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
	// Handle categories NOT covered by specific components
	// Assuming Appearance, Shortcuts are covered. Timer might need the loop if not componentized.
	return settingsStore.categories
		.filter((cat) => cat.name.toLowerCase() === "timer") // Only keep Timer for the loop
		.map((cat) => ({
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
      
      <AppearanceSettings />

      <!-- Timer Settings Loop -->
      <ErrorBoundary v-for="section of settingSections" :key="section.sectionTitle">
        <SettingSection :settings="section.settings" :section-title="section.sectionTitle" @change="handleSettingChange">
          <template v-if="section.sectionTitle.toLowerCase() === 'timer'" #header-actions>
            <TimerPresets :settings="draftSettings" @update-setting="handleSettingChange" @change="hasUnsavedChanges = true" />
          </template>
        </SettingSection>
      </ErrorBoundary>

      <ShortcutSettings :draftSettings="draftSettings" @change="hasUnsavedChanges = true" />

      <!-- Cloud Settings (Manual from HEAD) -->
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

      <ICalSettings :settings="draftSettings" :is-premium="settingsStore.isPremium" @update-setting="handleSettingChange" @save-all="saveChanges" @change="hasUnsavedChanges = true" />
      
      <DataManagement />

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
      @close="showUnsavedChangesModal = false; pendingRoute = null"
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

  </div>
</template>
