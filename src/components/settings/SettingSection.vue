<script setup lang="ts">
import SettingBox from "../../components/settings/SettingBox.vue";
import type { Setting } from "../../funcs/commands";
import ErrorBoundary from "../ErrorBoundary.vue";

const props = defineProps<{
	sectionTitle: string;
	settings: Array<Setting>;
}>();

const emit =
	defineEmits<
		(e: "change", id: number, value: string | number | boolean) => void
	>();
</script>
<template>
  <section class="mb-8">
    <h2 class="text-xs font-semibold text-pomodo-orange uppercase tracking-wider mb-4">
      {{props.sectionTitle}}
    </h2>
    <ErrorBoundary v-for="stt in settings">
      <SettingBox :setting="stt" @change="(id, val) => emit('change', id, val)"/>
    </ErrorBoundary>
  </section>
</template>
