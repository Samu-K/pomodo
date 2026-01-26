<script setup lang="ts">
import { Lock, RotateCcw } from "lucide-vue-next";
import { computed } from "vue";
import { useSettingsStore } from "../../stores/settings";
import { useThemeStore } from "../../stores/theme";
import { useUIStore } from "../../stores/ui";

const settings = useSettingsStore();
const ui = useUIStore();
const themeStore = useThemeStore();

const isLocked = computed(() => !settings.isPremium);

const colors = [
	{
		label: "Primary Color",
		key: "brand.orange",
		default: themeStore.colors.brand.orange
	},
	{
		label: "Secondary Color",
		key: "brand.red",
		default: themeStore.colors.brand.red
	},
	{
		label: "Text Color",
		key: "text.primary",
		default: themeStore.colors.text.primary
	}
];

const getColor = (key: string) => {
	return settings.themeOverrides[key] || themeStore.getColor(key);
};

const updateColor = (key: string, event: Event) => {
	const val = (event.target as HTMLInputElement).value;
	settings.updateThemeOverride(key, val);
};

const reset = () => {
	settings.themeOverrides = {};
};
</script>

<template>
    <section class="mb-8">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xs font-semibold text-pomodo-orange uppercase tracking-wider flex items-center gap-2">
                Theme Customization
                <Lock v-if="isLocked" :size="14" class="text-lightText-muted dark:text-text-muted" />
            </h2>
            <button 
                v-if="!isLocked && Object.keys(settings.themeOverrides).length > 0"
                @click="reset"
                class="text-xs text-lightText-muted dark:text-text-muted hover:text-pomodo-orange flex items-center gap-1 transition-colors"
            >
                <RotateCcw :size="12" /> Reset
            </button>
            <span v-if="isLocked" class="text-[10px] px-1.5 py-0.5 bg-pomodo-orange/10 text-pomodo-orange rounded border border-pomodo-orange/20 font-bold">PREMIUM</span>
        </div>

        <div class="relative rounded-2xl overflow-hidden">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-300" :class="{'blur-sm select-none pointer-events-none opacity-60': isLocked}">
                <div v-for="color in colors" :key="color.key" class="bg-light-surface dark:bg-dark-surface p-3 rounded-lg border border-light-border dark:border-dark-border flex items-center justify-between">
                    <span class="text-sm text-lightText-primary dark:text-white font-medium">{{ color.label }}</span>
                    <div class="flex items-center gap-2">
                         <div class="w-8 h-8 rounded-full overflow-hidden border border-light-border dark:border-dark-border shadow-sm relative">
                            <input 
                                type="color" 
                                :value="getColor(color.key)" 
                                @input="(e) => updateColor(color.key, e)"
                                class="absolute inset-0 w-full h-full p-0 border-0 opacity-0 cursor-pointer"
                                :disabled="isLocked"
                            />
                            <div class="w-full h-full pointer-events-none" :style="{ backgroundColor: getColor(color.key) }"></div>
                         </div>
                    </div>
                </div>
            </div>

            <!-- Lock Overlay -->
            <div
                v-if="isLocked"
                class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-light-bg/20 dark:bg-dark-bg/20 backdrop-blur-[4px] border border-pomodo-orange/10"
            >
                <div class="text-center p-4">
                    <p class="text-sm text-pomodo-orange font-bold mb-3">Unlock Theme Customization</p>
                    <button
                        @click="ui.setPremiumModal(true)"
                        class="px-6 py-2 bg-pomodo-orange hover:bg-pomodo-red text-white text-xs font-bold rounded-full shadow-lg shadow-pomodo-orange/20 transition-all transform hover:scale-105 pointer-events-auto"
                    >
                        Upgrade to Premium
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>
