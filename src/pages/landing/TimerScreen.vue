<script setup lang="ts">
import { Pause, Play, RotateCcw } from "lucide-vue-next";
import { ref } from "vue";
import { useCountdownTimer } from "../../components/timer/countdown";

const timer = useCountdownTimer(25 * 60);

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
</script>

<template>
  <div class="flex flex-col h-full bg-dark-bg">
    <!-- Main Timer Container -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 gap-10">
      <!-- Progress Ring -->
      <v-progress-circular :model-value="timer.percent.value" color="pomodo-orange" :size="160" width="10">
      </v-progress-circular>

      <!-- Timer Display -->
      <div class="text-timer text-pomodo-red">
        {{ timer.formattedTime }}
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
          @click="timer.resetTimer"
          class="w-12 h-12 rounded-full bg-dark-surface border border-dark-border text-text-secondary flex items-center justify-center"
          :disabled="timer.isRunning.value"
        >
          <RotateCcw :size="20" :class="{'opacity-50': timer.isRunning.value, 'hover:text-pomodo-orange hover:border-pomodo-orange/50 transition-all': !timer.isRunning.value}" />
        </button>
        
        <button 
          @click="timer.toggleTimer"
          class="w-20 h-20 rounded-full  text-white hover:scale-105 transition-transform shadow-fab hover:shadow-fab-hover flex items-center justify-center"
          :class="[
            {'bg-gradient-to-br from-pomodo-orange to-pomodo-red': !timer.isRunning.value},
            {'bg-gradient-to-br from-gray-600 to-black': timer.isRunning.value}
          ]"
        >
            <Pause :size="32" v-if="timer.isRunning.value"/>
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
