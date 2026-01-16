<script setup lang="ts">
import { ChevronLeft, Trash2 } from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import ErrorBoundary from "../../components/ErrorBoundary.vue";
import SettingSection from "../../components/settings/SettingSection.vue";
import ConfirmationModal from "../../components/ui/ConfirmationModal.vue";
import type { Setting } from "../../funcs/commands";
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

      <AppearanceSettings />
      <ShortcutSettings :draftSettings="draftSettings" @change="hasUnsavedChanges = true" />
      <ICalSettings :settings="draftSettings" :is-premium="settingsStore.isPremium" @update-setting="handleSettingChange" @save-all="saveChanges" @change="hasUnsavedChanges = true" />
      <DataManagement />
    </div>

    <ConfirmationModal v-if="showUnsavedChangesModal" title="Unsaved Changes" message="You have unsaved changes. Save before leaving?" primaryBtnText="Save Changes" secondaryBtnText="Discard Changes" @primary="saveChanges" @secondary="discardChanges" @close="showUnsavedChangesModal = false; pendingRoute = null" />
  </div>
</template>
