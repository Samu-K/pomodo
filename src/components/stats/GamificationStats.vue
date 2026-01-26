<script setup lang="ts">
import { Flame, Medal, Trophy } from "lucide-vue-next";
import { computed } from "vue";
import type { Session } from "../../funcs/commands";

const props = defineProps<{
	data: Session[];
}>();

const stats = computed(() => {
	const finishedSessions = props.data.filter((s) => s.finished && s.start_time);

	const totalSeconds = finishedSessions.reduce(
		(sum, s) => sum + (s.duration || 0),
		0
	);
	const totalHours = (totalSeconds / 3600).toFixed(1);

	const totalSessions = finishedSessions.length;

	// Daily Streak
	// Get unique dates
	const uniqueDates = new Set<string>();
	finishedSessions.forEach((s) => {
		if (s.start_time) {
			const date = new Date(s.start_time);
			// Format as YYYY-MM-DD to avoid time issues
			const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
			uniqueDates.add(dateStr);
		}
	});

	let streak = 0;
	const now = new Date();
	const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);
	const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

	let checkingDate = new Date(now);

	// Determine start point
	if (uniqueDates.has(todayStr)) {
		streak = 1;
		checkingDate.setDate(checkingDate.getDate() - 1);
	} else if (uniqueDates.has(yesterdayStr)) {
		streak = 1;
		checkingDate.setDate(checkingDate.getDate() - 2);
	} else {
		// Streak broken
		streak = 0;
	}

	// Continue checking if streak > 0
	if (streak > 0) {
		while (true) {
			// checkingDate is already set to the next day to check
			const checkStr = `${checkingDate.getFullYear()}-${checkingDate.getMonth() + 1}-${checkingDate.getDate()}`;
			if (uniqueDates.has(checkStr)) {
				streak++;
				checkingDate.setDate(checkingDate.getDate() - 1);
			} else {
				break;
			}
		}
	}

	return { totalHours, totalSessions, streak };
});
</script>

<template>
  <div class="mt-8">
    <h2 class="text-lg font-semibold text-lightText-primary dark:text-white mb-5">Lifetime Stats</h2>
    
    <div class="grid grid-cols-3 gap-4">
      <!-- Streak -->
      <div class="bg-light-surface dark:bg-dark-surface rounded-xl p-4 text-center">
        <div class="flex justify-center mb-2">
          <Flame :size="20" class="text-orange-500" />
        </div>
        <div class="text-2xl font-bold text-orange-500 mb-1">{{stats.streak}}</div>
        <div class="text-xs text-lightText-muted dark:text-text-muted">Day Streak</div>
      </div>

      <!-- Total Hours -->
      <div class="bg-light-surface dark:bg-dark-surface rounded-xl p-4 text-center">
        <div class="flex justify-center mb-2">
          <Trophy :size="20" class="text-yellow-500" />
        </div>
        <div class="text-2xl font-bold text-yellow-500 mb-1">{{stats.totalHours}}h</div>
        <div class="text-xs text-lightText-muted dark:text-text-muted">Total Focus</div>
      </div>
      
      <!-- Total Sessions -->
      <div class="bg-light-surface dark:bg-dark-surface rounded-xl p-4 text-center">
        <div class="flex justify-center mb-2">
          <Medal :size="20" class="text-purple-500" />
        </div>
        <div class="text-2xl font-bold text-purple-500 mb-1">{{stats.totalSessions}}</div>
        <div class="text-xs text-lightText-muted dark:text-text-muted">Sessions</div>
      </div>
    </div>
  </div>
</template>
