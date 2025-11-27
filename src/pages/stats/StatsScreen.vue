<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { Settings } from "lucide-vue-next";
import { computed, type Ref, ref } from "vue";
import { useRouter } from "vue-router";
import WeeklyFocusChart from "../../components/stats/WeeklyFocusChart.vue";
import WeeklyOverview from "../../components/stats/WeeklyOverview.vue";
import { get_categories } from "../../funcs/db/categories";
import { get_sessions } from "../../funcs/db/session";
import {
	formatDuration,
	isSameWeek,
	isToday
} from "../../funcs/stats/date_handling";

const router = useRouter();

const categoriesState = useQuery({
	queryKey: ["categories"],
	queryFn: get_categories
});
const sessionsState = useQuery({
	queryKey: ["sessions"],
	queryFn: get_sessions
});

const today_session_count: Ref<number> = ref(0);
const total_seconds_today: Ref<number> = ref(0);

const todaysFocusData = computed(() => {
	if (!sessionsState.data.value || !categoriesState.data.value) return [];

	const todaySessions = sessionsState.data.value.filter(
		(s) => s.finished && s.start_time && isToday(s.start_time)
	);
	console.log(todaySessions);
	today_session_count.value = todaySessions.length;

	const totalSeconds = todaySessions.reduce(
		(sum, s) => sum + (s.duration || 0),
		0
	);
	total_seconds_today.value = totalSeconds;

	if (totalSeconds === 0) return [];

	return categoriesState.data.value
		.map((cat) => {
			const catSeconds = todaySessions
				.filter((s) => s.category_id === cat.id)
				.reduce((sum, s) => sum + (s.duration || 0), 0);

			return {
				category: cat.name,
				color: cat.color ? `bg-${cat.color}` : "bg-pomodo-orange",
				time: formatDuration(catSeconds),
				percentage:
					totalSeconds > 0 ? Math.round((catSeconds / totalSeconds) * 100) : 0
			};
		})
		.filter((item) => item.percentage > 0)
		.sort((a, b) => b.percentage - a.percentage);
});

const weeklySessionsRaw = computed(() => {
	if (!sessionsState.data.value) return [];
	return sessionsState.data.value.filter(
		(s) => s.start_time && isSameWeek(s.start_time)
	);
});
</script>

<template>
  <div class="flex flex-col h-full bg-light-bg dark:bg-dark-bg">
    <div class="flex-1 overflow-y-auto px-6 py-6">
      <div class="flex items-center justify-between mb-8">
        <!-- Header -->
        <h1 class="text-2xl font-semibold text-pomodo-orange">
          Today's Summary
        </h1>

        <button 
          @click="router.push('/settings')"
          class="-mt-2 text-pomodo-orange hover:bg-light-surface dark:hover:bg-dark-surface rounded-lg transition-colors"
        >
          <Settings :size="20" />
        </button>
      </div>

      <!-- Focus Time Section -->
      <section class="mb-10">
        <h2 class="text-lg font-semibold text-lightText-primary dark:text-white mb-5">Focus Time  -  Total {{formatDuration(total_seconds_today)}}</h2>
        
        <div v-for="item in todaysFocusData" :key="item.category" class="flex items-center mb-5">
          <div class="flex items-center gap-3 w-24">
            <div class="w-3 h-3 rounded-full" :class="item.color"></div>
            <span class="text-lightText-primary dark:text-white text-sm">{{ item.category }}</span>
          </div>
          <div class="flex-1 mx-4 h-1.5 bg-light-surface dark:bg-dark-surface rounded-full overflow-hidden">
            <div 
              class="h-full rounded-full transition-all duration-500" 
              :class="item.color"
              :style="`width: ${item.percentage}%`"
            ></div>
          </div>
          <span class="text-lightText-secondary dark:text-text-secondary text-sm min-w-[60px] text-right">{{ item.time }}</span>
        </div>

        <div class="flex items-center justify-end">
          <button 
          @click="router.push('/stats/log')"
          class="text-pomodo-orange hover:bg-light-surface dark:hover:bg-dark-surface rounded-lg transition-colors bg-light-surface dark:bg-dark-surface px-4 py-2"
        >
            View session log
        </button>
        </div>
        <p class="text-lightText-muted dark:text-text-muted text-center text-sm mt-6">
          {{today_session_count}} focus sessions completed today
        </p>
      </section>

      <!-- Completed Tasks Section -->
      <!--
      <section class="mb-10">
        <h2 class="text-lg font-semibold text-white mb-5">Completed Tasks</h2>
        
        <div class="space-y-3">
          <div 
            v-for="task in completedTasks" 
            :key="task.id"
            class="flex items-center justify-between p-3 bg-dark-surface rounded-lg"
          >
            <div class="flex items-center gap-3">
              <CheckCircle :size="18" class="text-green-500" />
              <span class="text-white">{{ task.name }}</span>
            </div>
            <span class="text-text-secondary text-sm">{{ task.duration }}</span>
          </div>
        </div>
      </section>
      -->

      <!-- Weekly Overview -->
      <section>
        <WeeklyOverview :data="weeklySessionsRaw"/>
      </section>

      <!-- Week Chart Preview -->
      <section class="mt-10">
        <WeeklyFocusChart :data="weeklySessionsRaw"/>
      </section>
    </div>
  </div>
</template>
