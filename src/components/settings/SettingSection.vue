<script setup lang="ts">
import { SettingRef } from "../../defines/settings.ts";

const props = defineProps<{
	sectionTitle: string;
	settings: Array<SettingRef>;
}>();
</script>
<template>
  <section class="mb-8">
    <h2 class="text-xs font-semibold text-pomodo-orange uppercase tracking-wider mb-4">
      {{props.sectionTitle}}
    </h2>
    <div v-for="stt in settings">
      <SettingBox :label="stt.key" :sublabel="stt.description" :model-value="stt.dataRef"/>
    </div>
  </section>
</template>
