<script setup lang="ts">
import { Check, Crown, X } from "lucide-vue-next";
import { useSettingsStore } from "../../stores/settings";
import { useUIStore } from "../../stores/ui";

const emit = defineEmits(["close"]);
const settings = useSettingsStore();
const ui = useUIStore();

const features = [
	"Unlimited Projects",
	"Advanced Analytics & Charts",
	"Focus Heatmap (14+ Days)",
	"Custom Themes & Colors",
	"Data Export"
];

const handleUpgrade = () => {
	settings.setPremium(true);
	ui.showSuccess("Welcome to Premium!");
	emit("close");
};
</script>

<template>
	<v-dialog :model-value="true" max-width="420" @update:model-value="emit('close')" class="backdrop-blur-sm">
		<div class="bg-light-bg dark:bg-dark-bg rounded-2xl overflow-hidden border border-light-border dark:border-dark-border shadow-2xl mx-auto ring-1 ring-black/5 dark:ring-white/5">
			<!-- Header with gradient -->
			<div class="bg-gradient-to-br from-pomodo-orange/10 to-pomodo-red/10 dark:from-pomodo-orange/20 dark:to-pomodo-red/20 p-8 flex flex-col items-center text-center relative">
				<button 
					@click="emit('close')"
					class="absolute top-4 right-4 text-lightText-muted dark:text-text-muted hover:text-lightText-primary dark:hover:text-white transition-colors"
				>
					<X :size="20" />
				</button>

				<div class="bg-gradient-to-br from-pomodo-orange to-pomodo-red w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-pomodo-orange/30">
					<Crown :size="40" class="text-white" />
				</div>

				<h2 class="text-2xl font-bold mb-3 text-lightText-primary dark:text-white">Upgrade to Premium</h2>
				<p class="text-lightText-secondary dark:text-text-secondary text-sm leading-relaxed px-2">
					Unlock the full power of Pomodo with advanced analytics, customization, and more.
				</p>
			</div>

			<!-- Features List -->
			<div class="p-8 bg-light-surface dark:bg-dark-surface">
				<div class="space-y-4 mb-8">
					<div v-for="feature in features" :key="feature" class="flex items-center gap-4">
						<div class="flex-shrink-0 w-6 h-6 rounded-full bg-utility-success/10 flex items-center justify-center">
							<Check :size="14" class="text-utility-success" />
						</div>
						<span class="text-lightText-primary dark:text-text-primary text-sm font-medium">{{ feature }}</span>
					</div>
				</div>

				<button 
					@click="handleUpgrade"
					class="w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-pomodo-orange to-pomodo-red hover:shadow-lg hover:shadow-pomodo-orange/25 active:scale-[0.98] transition-all duration-200"
				>
					Unlock All Features
				</button>
				
				<p class="text-center text-xs text-lightText-muted dark:text-text-muted mt-6 font-medium">
					One-time purchase. No subscription.
				</p>
			</div>
		</div>
	</v-dialog>
</template>
