<script setup lang="ts">
import { FileJson, FileSpreadsheet, Lock } from "lucide-vue-next";
import { ref } from "vue";
import { exportUserData } from "../../../funcs/export";
import { useSettingsStore } from "../../../stores/settings";
import { useUIStore } from "../../../stores/ui";

const settingsStore = useSettingsStore();
const uiStore = useUIStore();
const isExporting = ref(false);

const handleExport = async (format: "json" | "csv") => {
	if (!settingsStore.isPremium) {
		uiStore.setPremiumModal(true);
		return;
	}
	try {
		isExporting.value = true;
		await exportUserData(format);
	} catch (e) {
		uiStore.setError(`Export failed: ${e}`);
	} finally {
		isExporting.value = false;
	}
};
</script>

<template>
  <section class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xs font-semibold text-pomodo-orange uppercase tracking-wider">Data Management</h2>
        <span v-if="!settingsStore.isPremium" class="text-[10px] px-1.5 py-0.5 bg-pomodo-orange/10 text-pomodo-orange rounded border border-pomodo-orange/20 font-bold">PREMIUM</span>
      </div>
      <div class="py-4 border-b border-light-border dark:border-dark-border relative">
        <div class="flex items-center justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lightText-primary dark:text-white font-medium flex items-center gap-2">
              Export Data
              <Lock v-if="!settingsStore.isPremium" :size="14" class="text-lightText-muted dark:text-text-muted" />
            </h3>
            <p class="text-xs text-lightText-muted dark:text-text-muted mt-1">Download your data.</p>
          </div>
        </div>
        <div class="flex gap-3">
          <button @click="handleExport('json')" :disabled="isExporting" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors text-lightText-primary dark:text-white text-sm" :class="{ 'opacity-50 cursor-not-allowed': isExporting }">
            <FileJson :size="16" /><span>JSON</span>
          </button>
          <button @click="handleExport('csv')" :disabled="isExporting" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg transition-colors text-lightText-primary dark:text-white text-sm" :class="{ 'opacity-50 cursor-not-allowed': isExporting }">
            <FileSpreadsheet :size="16" /><span>CSV</span>
          </button>
        </div>
      </div>
    </section>
</template>
