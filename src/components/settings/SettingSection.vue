<script setup lang="ts">
import SettingBox from "../../components/settings/SettingBox.vue";
import { Setting } from "../../defines/settings.ts";
import ErrorBoundary from "../ErrorBoundary.vue";

const props = defineProps<{
	sectionTitle: string;
	settings: Array<Setting>;
}>();
</script>
<template>
  <section class="mb-8">
    <h2 class="text-xs font-semibold text-pomodo-orange uppercase tracking-wider mb-4">
      {{props.sectionTitle}}
    </h2>
    <ErrorBoundary v-for="stt in settings">
      <SettingBox :setting="stt"/>
    </ErrorBoundary>
  </section>
</template>
