<script setup lang="ts">
import { Crown, Lock, X } from "lucide-vue-next";
import { useSettingsStore } from "../../stores/settings";
import { useUIStore } from "../../stores/ui";

const emit = defineEmits(["close"]);
const settings = useSettingsStore();
const ui = useUIStore();

const handleUpgrade = () => {
	settings.setPremium(true);
	ui.showSuccess("Welcome to Premium! You can now create unlimited projects.");
	emit("close");
};
</script>

<template>
	<v-dialog :model-value="true" max-width="400" @update:model-value="emit('close')" class="backdrop-blur-sm">
		<div class="bg-light-bg dark:bg-dark-bg rounded-2xl overflow-hidden border border-light-border dark:border-dark-border shadow-2xl mx-auto ring-1 ring-black/5 dark:ring-white/5 relative">
			<div class="p-8 text-center">
				<button 
					@click="emit('close')"
					class="absolute top-4 right-4 text-lightText-muted dark:text-text-muted hover:text-lightText-primary dark:hover:text-white transition-colors"
				>
					<X :size="20" />
				</button>

				<div class="mx-auto w-20 h-20 rounded-full bg-light-surface dark:bg-dark-surface flex items-center justify-center mb-6 relative shadow-inner">
					<Lock :size="36" class="text-lightText-secondary dark:text-text-secondary" />
					<div class="absolute -bottom-1 -right-1 bg-pomodo-orange rounded-full p-1.5 border-4 border-light-bg dark:border-dark-bg shadow-lg">
						<Crown :size="14" class="text-white" />
					</div>
				</div>

				<h2 class="text-2xl font-bold mb-3 text-lightText-primary dark:text-white">Project Limit Reached</h2>
				<p class="text-lightText-secondary dark:text-text-secondary text-sm leading-relaxed mb-8 px-2">
					Free users can create up to 10 projects. <br/>
					Upgrade to Premium for unlimited projects.
				</p>

				<div class="space-y-3">
					<button 
						@click="handleUpgrade"
						class="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-pomodo-orange to-pomodo-red hover:shadow-lg hover:shadow-pomodo-orange/25 active:scale-[0.98] transition-all"
					>
						Upgrade to Unlimited
					</button>
					<button 
						@click="emit('close')"
						class="w-full py-3 px-6 rounded-xl font-medium text-lightText-secondary dark:text-text-secondary hover:bg-light-surface dark:hover:bg-dark-surface transition-colors"
					>
						Maybe Later
					</button>
				</div>
			</div>
		</div>
	</v-dialog>
</template>
