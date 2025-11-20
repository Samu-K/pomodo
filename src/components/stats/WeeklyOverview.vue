<script setup lang="ts">
import { Clock, Target, TrendingUp } from "lucide-vue-next";
import { computed } from "vue";
import type { Session } from "../../defines/session";

const props = defineProps<{
	data: Session[];
}>();

const weeklyStats = computed(() => {
	const allWeek = props.data;
	const finishedWeek = allWeek.filter((s) => s.finished);

	// Total Seconds
	const totalSeconds = finishedWeek.reduce((sum, s) => sum + s.duration, 0);

	// Convert Seconds to Hours (Fixed to 1 decimal)
	const totalHours = (totalSeconds / 3600).toFixed(1);

	const totalCount = allWeek.length;
	const finishedCount = finishedWeek.length;
	const completionRate =
		totalCount > 0 ? Math.round((finishedCount / totalCount) * 100) : 0;

	// Daily Avg remains count-based, so no change here
	const dailyAvg = (finishedCount / 7).toFixed(1);

	return { totalHours, completionRate, dailyAvg };
});
</script>

<template>
  <h2 class="text-lg font-semibold text-white mb-5">Weekly Overview</h2>
  
  <div class="grid grid-cols-3 gap-4">
    <div class="bg-dark-surface rounded-xl p-4 text-center">
      <div class="flex justify-center mb-2">
        <Clock :size="20" class="text-pomodo-orange" />
      </div>
      <div class="text-2xl font-bold text-pomodo-orange mb-1">{{weeklyStats.totalHours}}h</div>
      <div class="text-xs text-text-muted">Total Focus</div>
    </div>
    
    <div class="bg-dark-surface rounded-xl p-4 text-center">
      <div class="flex justify-center mb-2">
        <Target :size="20" class="text-pomodo-red" />
      </div>
      <div class="text-2xl font-bold text-pomodo-red mb-1">{{weeklyStats.completionRate}}%</div>
      <div class="text-xs text-text-muted">Completion </div>
  </div>
    
    <div class="bg-dark-surface rounded-xl p-4 text-center">
      <div class="flex justify-center mb-2">
        <TrendingUp :size="20" class="text-pomodo-gold" />
      </div>
      <div class="text-2xl font-bold text-pomodo-gold mb-1">{{weeklyStats.dailyAvg}}</div>
      <div class="text-xs text-text-muted">Avg Sessions</div>
    </div>
  </div>
</template>
