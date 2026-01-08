<script setup lang="ts">
import { Lock } from "lucide-vue-next";
import { computed } from "vue";
import type { Session } from "../../funcs/commands";
import { useSettingsStore } from "../../stores/settings";
import { useUIStore } from "../../stores/ui";
import ProductivityTimeOfDay from "./ProductivityTimeOfDay.vue";
import ProjectDistribution from "./ProjectDistribution.vue";
import TrendAnalysis from "./TrendAnalysis.vue";

const { sessions } = defineProps<{
	sessions: Session[];
}>();

const settings = useSettingsStore();
const ui = useUIStore();

const isLocked = computed(() => !settings.isPremium);

// If locked, we could pass dummy data to charts to make them look "active" behind the blur
// or just pass the real data (if available) and blur it.
// If the user has little data, the charts might look empty even if blurred.
// Let's pass the real data.
</script>

<template>
	<section class="relative rounded-2xl overflow-hidden mt-10">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-semibold text-lightText-primary dark:text-white flex items-center gap-2">
				<span class="bg-gradient-to-r from-pomodo-orange to-red-500 bg-clip-text text-transparent">
                    Advanced Analytics
                </span>
                <span v-if="isLocked" class="text-xs bg-pomodo-orange/10 text-pomodo-orange px-2 py-0.5 rounded ml-2 border border-pomodo-orange/20">PREMIUM</span>
			</h2>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" :class="{ 'blur-sm select-none pointer-events-none opacity-60': isLocked }">
			<ProductivityTimeOfDay :sessions="sessions" :class="{ 'md:col-span-2 lg:col-span-3': isLocked }" />
			<ProjectDistribution v-if="!isLocked" :sessions="sessions" />
            <div v-if="!isLocked" class="md:col-span-2 lg:col-span-3">
			    <TrendAnalysis :sessions="sessions" />
            </div>
		</div>

		<!-- Lock Overlay -->
		<div
			v-if="isLocked"
			class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-light-bg/30 dark:bg-dark-bg/30 backdrop-blur-[2px]"
		>
			<div class="bg-light-surface dark:bg-dark-surface p-6 rounded-2xl shadow-2xl border border-light-border dark:border-dark-border text-center max-w-sm mx-4">
				<div class="w-12 h-12 bg-pomodo-orange/10 rounded-full flex items-center justify-center mx-auto mb-4 text-pomodo-orange">
					<Lock :size="24" />
				</div>
				<h3 class="text-lg font-bold text-lightText-primary dark:text-white mb-2">
					Unlock Advanced Insights
				</h3>
				<p class="text-lightText-secondary dark:text-text-secondary text-sm mb-6">
					Get detailed productivity breakdowns, trend analysis, and project distribution charts.
				</p>
				<button
					@click="ui.setPremiumModal(true)"
					class="w-full bg-pomodo-orange hover:bg-pomodo-red text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-pomodo-orange/20"
				>
					Upgrade to Premium
				</button>
			</div>
		</div>
	</section>
</template>
