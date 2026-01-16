<script setup lang="ts">
import { Calendar, Copy, ExternalLink } from "lucide-vue-next";
import { computed, ref } from "vue";
import ConfirmationModal from "../../../components/ui/ConfirmationModal.vue";
import type { Setting } from "../../../funcs/commands";
import { useTasks } from "../../../stores/task";
import { useUIStore } from "../../../stores/ui";

const props = defineProps<{
	settings: Setting[];
	isPremium: boolean;
}>();

const emit = defineEmits<{
	(e: "update-setting", key: string, value: string): void;
	(e: "save-all"): void;
	(e: "change"): void;
}>();

const uiStore = useUIStore();
const taskStore = useTasks();

const copyFeedback = ref(false);
const showICalModal = ref(false);
const showDisableConfirm = ref(false);

const icalFeedUrl = computed(() => {
	const url = props.settings.find((s) => s.key === "iCal sync URL")?.value;
	const token = props.settings.find((s) => s.key === "iCal sync token")?.value;
	if (!url || !token) return "";
	return `${url.replace(/\/$/, "")}/cal/${token}`;
});

const isICalEnabled = computed(() => {
	return (
		props.settings.find((s) => s.key === "iCal sync enabled")?.value === "true"
	);
});

const copyToClipboard = (text: string) => {
	navigator.clipboard.writeText(text);
	copyFeedback.value = true;
	setTimeout(() => {
		copyFeedback.value = false;
	}, 2000);
};

const handleSyncNow = async () => {
	try {
		await taskStore.syncICal();
	} catch (e) {
		uiStore.setError(`Sync failed: ${e}`);
	}
};

const handleEnableICal = async () => {
	const tokenSetting = props.settings.find((s) => s.key === "iCal sync token");
	const enabledSetting = props.settings.find(
		(s) => s.key === "iCal sync enabled"
	);
	const urlSetting = props.settings.find((s) => s.key === "iCal sync URL");

	if (urlSetting && !urlSetting.value) {
		emit(
			"update-setting",
			"iCal sync URL",
			"https://kasame.net/pomodo/ical-sync"
		);
	}

	if (tokenSetting && !tokenSetting.value) {
		emit("update-setting", "iCal sync token", crypto.randomUUID());
	}

	if (enabledSetting) {
		emit("update-setting", "iCal sync enabled", "true");
	}

	// Trigger immediate save and sync
	emit("save-all");
	await handleSyncNow();
	showICalModal.value = true;
};

const handleDisableICal = () => {
	showDisableConfirm.value = true;
};

const confirmDisableICal = async () => {
	emit("update-setting", "iCal sync enabled", "false");
	emit("save-all");
	showDisableConfirm.value = false;
};
</script>

<template>
  <section class="mb-8">
    <h2 class="text-xs font-semibold text-pomodo-orange uppercase tracking-wider mb-4 flex items-center gap-2">
      <Calendar :size="14" />
      Calendar Sync
    </h2>
    
    <div class="py-4 border-b border-light-border dark:border-dark-border">
      <div v-if="!isICalEnabled" class="flex flex-col gap-4">
        <div>
          <h3 class="text-lightText-primary dark:text-white font-medium">Sync your tasks</h3>
          <p class="text-xs text-lightText-muted dark:text-text-muted mt-1">
            View your Pomodo tasks in Google Calendar, Apple Calendar, or Outlook.
          </p>
        </div>
        <button 
          @click="handleEnableICal"
          class="w-full py-3 bg-gradient-to-r from-pomodo-orange to-pomodo-red text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Calendar :size="18" />
          Sync to calendar
        </button>
      </div>

      <div v-else class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lightText-primary dark:text-white font-medium">Calendar Sync is active</h3>
            <p class="text-xs text-lightText-muted dark:text-text-muted mt-1">
              Your tasks are being synced to your external calendar.
            </p>
          </div>
          <div class="flex items-center gap-2">
             <button 
              @click="showICalModal = true"
              class="p-2 text-pomodo-orange hover:bg-pomodo-orange/10 rounded-lg transition-colors"
              title="View Sync Link"
            >
              <ExternalLink :size="20" />
            </button>
          </div>
        </div>
        
        <button 
          @click="handleDisableICal"
          class="w-full py-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-pomodo-red font-bold rounded-xl hover:bg-pomodo-red/5 transition-all text-sm"
        >
          Disable sync
        </button>
      </div>
    </div>

    <!-- iCal Sync Modal -->
    <v-dialog v-model="showICalModal" max-width="500">
      <div class="bg-light-surface dark:bg-dark-surface p-7 rounded-2xl border border-light-border dark:border-dark-border shadow-2xl">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-pomodo-orange/10 rounded-lg">
            <Calendar :size="24" class="text-pomodo-orange" />
          </div>
          <h3 class="text-xl font-bold text-lightText-primary dark:text-white">Calendar Sync Active!</h3>
        </div>
        
        <p class="text-sm text-lightText-muted dark:text-text-muted mb-6 leading-relaxed">
          Your tasks are now available to your external calendar. Copy the link below and add it as a "New Calendar via URL" in your favorite calendar app.
        </p>
        
        <div class="mb-8">
          <label class="text-[10px] font-bold text-pomodo-orange uppercase tracking-widest mb-2 block">Your Personal Feed URL</label>
          <div class="flex items-center gap-3 p-4 bg-gray-100 dark:bg-black/30 rounded-xl border border-gray-200 dark:border-white/10 group relative shadow-inner overflow-hidden">
            <div class="flex-1 min-w-0 pr-2">
              <code class="text-[11px] break-all text-gray-800 dark:text-pomodo-orange select-all font-mono leading-relaxed block">
                {{ icalFeedUrl }}
              </code>
            </div>
            <button 
              @click="copyToClipboard(icalFeedUrl)"
              class="p-2.5 text-gray-500 dark:text-gray-400 hover:text-pomodo-orange hover:bg-pomodo-orange/10 rounded-lg transition-all shrink-0 border border-transparent hover:border-pomodo-orange/20"
              title="Copy to clipboard"
            >
              <Copy v-if="!copyFeedback" :size="18" />
              <span v-else class="text-[10px] font-bold text-pomodo-orange uppercase tracking-tighter">Copied</span>
            </button>
          </div>
        </div>

        <div class="space-y-4 mb-8">
          <h4 class="text-xs font-bold text-lightText-primary dark:text-gray-300 uppercase tracking-wider">Quick Instructions</h4>
          <div class="grid grid-cols-1 gap-3">
            <div class="flex items-start gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 transition-colors hover:bg-gray-100 dark:hover:bg-white/10">
              <div class="w-6 h-6 flex items-center justify-center bg-pomodo-orange text-white text-xs font-bold rounded-full shrink-0 shadow-lg">1</div>
              <p class="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">Copy the link shown above.</p>
            </div>
            <div class="flex items-start gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 transition-colors hover:bg-gray-100 dark:hover:bg-white/10">
              <div class="w-6 h-6 flex items-center justify-center bg-pomodo-orange text-white text-xs font-bold rounded-full shrink-0 shadow-lg">2</div>
              <p class="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">Open Google, Apple, or Outlook Calendar.</p>
            </div>
            <div class="flex items-start gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 transition-colors hover:bg-gray-100 dark:hover:bg-white/10">
              <div class="w-6 h-6 flex items-center justify-center bg-pomodo-orange text-white text-xs font-bold rounded-full shrink-0 shadow-lg">3</div>
              <p class="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">Select <span class="font-bold text-pomodo-orange">"Add by URL"</span> or <span class="font-bold text-pomodo-orange">"Subscribe"</span> and paste the link.</p>
            </div>
          </div>
        </div>

        <button 
          @click="showICalModal = false"
          class="w-full py-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-lightText-primary dark:text-white font-bold rounded-xl hover:bg-light-bg dark:hover:bg-dark-bg transition-all text-sm"
        >
          Got it
        </button>
      </div>
    </v-dialog>

    <ConfirmationModal
      v-if="showDisableConfirm"
      title="Disable iCal Sync?"
      message="Your tasks will no longer be synced to your external calendar. The existing calendar link will stop working."
      primaryBtnText="Disable Sync"
      secondaryBtnText="Cancel"
      :isDanger="true"
      @primary="confirmDisableICal"
      @secondary="showDisableConfirm = false"
      @close="showDisableConfirm = false"
    />
  </section>
</template>
