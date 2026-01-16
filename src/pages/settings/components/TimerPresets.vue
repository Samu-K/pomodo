<script setup lang="ts">
import { LayoutGrid, Save, X } from "lucide-vue-next";
import { computed, ref } from "vue";
import type { Setting } from "../../../funcs/commands";

interface TimerPreset {
	name: string;
	focus: number;
	rest: number;
	interval: number;
	longRest: number;
}

const props = defineProps<{
	settings: Setting[];
}>();

const emit = defineEmits<{
	(e: "update-setting", key: string, value: string): void;
	(e: "change"): void;
}>();

const presetName = ref("");
const showPresetDialog = ref(false);

const customPresets = computed<TimerPreset[]>(() => {
	const setting = props.settings.find((s) => s.key === "Timer Presets");
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
		emit("update-setting", key, String(value));
	}
	emit("change");
};

const handleSavePreset = () => {
	if (!presetName.value.trim()) return;

	const getVal = (key: string) =>
		Number(props.settings.find((s) => s.key === key)?.value || 0);

	const newPreset: TimerPreset = {
		name: presetName.value.trim(),
		focus: getVal("Focus Duration"),
		rest: getVal("Short Break Time"),
		interval: getVal("Long Break Interval"),
		longRest: getVal("Long Break Time")
	};

	const updatedPresets = [...customPresets.value, newPreset];
	emit("update-setting", "Timer Presets", JSON.stringify(updatedPresets));
	emit("change");

	presetName.value = "";
	showPresetDialog.value = false;
};

const deletePreset = (index: number) => {
	const updatedPresets = [...customPresets.value];
	updatedPresets.splice(index, 1);
	emit("update-setting", "Timer Presets", JSON.stringify(updatedPresets));
	emit("change");
};
</script>

<template>
  <v-menu location="bottom end" :close-on-content-click="false">
    <template v-slot:activator="{ props: menuProps }">
      <button 
        v-bind="menuProps"
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
</template>
