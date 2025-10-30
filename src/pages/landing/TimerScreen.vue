<script setup lang="ts">
import { Pause, Play, RotateCcw, SkipForward } from "lucide-vue-next";
import { ref, computed, onUnmounted } from "vue";

const initialTimeInSeconds = 25 * 60;

const remainingTime = ref(initialTimeInSeconds);
const isRunning = ref(false);
let timerId: number | undefined;

const formatTime = (totalSeconds: number): string => {
	if (totalSeconds < 0) {
		totalSeconds = 0;
	}

	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const pad = (num: number) => num.toString().padStart(2, "0");

	const formattedMinutes = pad(minutes);
	const formattedSeconds = pad(seconds);

	if (hours > 0) {
		return `${pad(hours)}:${formattedMinutes}:${formattedSeconds}`;
	} else {
		return `${formattedMinutes}:${formattedSeconds}`;
	}
};

const formattedTime = computed(() => formatTime(remainingTime.value));

const tick = () => {
	if (remainingTime.value > 0) {
		remainingTime.value--;
	} else {
		pauseTimer();
	}
};

const startTimer = () => {
	if (!isRunning.value && remainingTime.value > 0) {
		isRunning.value = true;
		timerId = window.setInterval(tick, 1000);
	}
};

const pauseTimer = () => {
	isRunning.value = false;
	if (timerId) {
		clearInterval(timerId);
		timerId = undefined;
	}
};

const toggleTimer = () => {
	if (isRunning.value) {
		pauseTimer();
	} else {
		startTimer();
	}
};

const resetTimer = () => {
	pauseTimer();
	remainingTime.value = initialTimeInSeconds;
};

const categories = ref<Array<string>>([
	"work",
	"school",
	"project",
	"cleaning"
]);

const selected_category = ref<string>(categories.value[0]);

const emit = defineEmits<{
	play: [];
	pause: [];
	reset: [];
	skip: [];
	categoryChange: [category: string];
}>();

onUnmounted(() => {
	pauseTimer();
});
</script>

<template>
  <div class="flex flex-col h-full bg-dark-bg">
    <!-- Main Timer Container -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 gap-10">
      
      <!-- Progress Ring -->
      <div class="relative w-52 h-52">
        <svg class="transform -rotate-90 w-52 h-52">
          <circle
            cx="104"
            cy="104"
            r="96"
            stroke-width="8"
            fill="none"
            class="stroke-dark-border"
          />
          <circle
            cx="104"
            cy="104"
            r="96"
            stroke-width="8"
            fill="none"
            class="stroke-pomodo-orange"
            stroke-linecap="round"
            stroke-dasharray="603.19"
            :stroke-dashoffset="150"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-10 h-10 bg-pomodo-orange rounded-full"></div>
        </div>
      </div>

      <!-- Timer Display -->
      <div class="text-timer text-pomodo-red">
        {{ formattedTime }}
      </div>

      <div class="w-64 h-22">
        <!-- Category Selector -->
        <v-select
          v-model="selected_category"
          :items="categories"
          label="Category"
        >
        </v-select>
      </div>

      <!-- Control Buttons -->
      <div class="flex items-center gap-8 absolute bottom-40">
        <button 
          @click="resetTimer"
          class="w-12 h-12 rounded-full bg-dark-surface border border-dark-border text-text-secondary flex items-center justify-center"
          :disabled="isRunning"
        >
          <RotateCcw :size="20" :class="{'opacity-50': isRunning, 'hover:text-pomodo-orange hover:border-pomodo-orange/50 transition-all': !isRunning}" />
        </button>
        
        <button 
          @click="toggleTimer"
          class="w-20 h-20 rounded-full  text-white hover:scale-105 transition-transform shadow-fab hover:shadow-fab-hover flex items-center justify-center"
          :class="[
            {'bg-gradient-to-br from-pomodo-orange to-pomodo-red': !isRunning},
            {'bg-gradient-to-br from-gray-600 to-black': isRunning}
          ]"
        >
            <Pause :size="32" v-if="isRunning"/>
            <Play :size="32" v-else/>
        </button>
        
        <button 
          @click="emit('skip')"
          class="bg-opacity-0 border-opacity-0 w-12 h-12 rounded-full bg-dark-surface border border-dark-border text-text-secondary hover:text-pomodo-orange hover:border-pomodo-orange/50 transition-all flex items-center justify-center"
          disabled
        >
          <!--<SkipForward :size="20" />-->
        </button>
      </div>
    </div>

    <!-- Task Preview Bar (optional) -->
    <div class="px-6 py-4 bg-dark-pure border-t border-dark-border">
      <div class="text-text-muted text-sm text-center">
        Next: Algorithm Study (4 pomodoros)
      </div>
    </div>
  </div>
</template>
