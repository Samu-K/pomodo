<script setup lang="ts">
import { computed } from "vue";
import type { Setting } from "../../funcs/commands";

const props = defineProps<{
	setting: Setting;
}>();

const emit =
	defineEmits<
		(e: "change", id: number, value: string | number | boolean) => void
	>();

if (!props.setting) {
	throw Error(`Error with setting definition: ${props.setting}`);
}

const value_ref = computed({
	get: () => {
		if (props.setting.data_type === "boolean") {
			return props.setting.value === "true";
		} else if (props.setting.data_type === "number") {
			return Number(props.setting.value);
		}
		return undefined;
	},
	set: (newValue) => {
		if (newValue === undefined || newValue === null) return;
		emit("change", props.setting.id, newValue);
	}
});
</script>
<template>
  <div v-if="typeof value_ref === 'undefined'">
  </div>
  <div v-else class="flex items-center justify-between">
    <div class="flex flex-col">
      <p class="text-white font-medium">{{props.setting.key}}</p>
      <p class="text-text-muted text-xs">{{props.setting.description}}</p>
    </div>
    <div v-if="typeof value_ref === 'boolean'">
      <v-switch class="pr-4" v-model="value_ref" color="orange-lighten-1" base-color="grey-darken-3" inset></v-switch>
    </div>
    <div v-else-if="typeof value_ref === 'number'">
      <v-number-input
        :reverse="false"
        controlVariant="split"
        v-model="value_ref"
        :hideInput="false"
        :inset="false"
        variant="solo-filled"
        width="150"
        :min=1
      ></v-number-input>
    </div>
  </div>
</template>
