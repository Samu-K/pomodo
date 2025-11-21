<script setup lang="ts">
const props = defineProps<{
	label: string;
	sublabel: string;
	modelValue: number | boolean;
}>();
</script>
<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-col">
      <p class="text-white font-medium">{{props.label}}</p>
      <p class="text-text-muted text-xs ">{{props.sublabel}}</p>
    </div>
    <div v-if="typeof props.modelValue === 'boolean'">
      <v-switch :model-value="props.modelValue" color="orange-lighten-1" base-color="grey-darken-3" inset></v-switch>
    </div>
    <div v-else-if="typeof props.modelValue === 'number'">
      <v-number-input
        :reverse="false"
        controlVariant="split"
        :model-value="props.modelValue"
        :hideInput="false"
        :inset="false"
        variant="solo-filled"
        class="pl-10 "
      ></v-number-input>
    </div>
  </div>
</template>
