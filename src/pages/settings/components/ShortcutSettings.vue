<script setup lang="ts">
import ShortcutRecorder from "../../../components/settings/ShortcutRecorder.vue";
import type { Setting } from "../../../funcs/commands";

defineProps<{
	draftSettings: Setting[];
}>();

const emit = defineEmits<(e: "change") => void>();
</script>

<template>
  <section class="mb-8">
    <h2 class="text-xs font-semibold text-pomodo-orange uppercase tracking-wider mb-4">
      Shortcuts
    </h2>
    <div class="w-full">
       <div v-for="setting in draftSettings.filter(s => s.key === 'Toggle Timer')" :key="setting.id">
          <ShortcutRecorder
              data-testid="shortcut-recorder-toggle-timer"
              label="Pause Timer"
              v-model="setting.value"
              @update:model-value="emit('change')"
          />
       </div>
    </div>
  </section>
</template>
