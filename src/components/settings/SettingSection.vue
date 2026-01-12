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
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xs font-semibold text-pomodo-orange uppercase tracking-wider">
        {{props.sectionTitle}}
      </h2>
      <slot name="header-actions"></slot>
    </div>
    <ErrorBoundary v-for="stt in settings">
      <SettingBox :setting="stt" @change="(id, val) => emit('change', id, val)"/>
    </ErrorBoundary>
  </section>
</template>
