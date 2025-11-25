<script setup lang="ts">
import { useMutation } from "@tanstack/vue-query";
import { type Ref, ref, watch } from "vue";
import { Setting } from "../../defines/settings.ts";
import { set_setting_value } from "../../funcs/db/settings.ts";

const props = defineProps<{
	setting: Setting;
}>();
if (!props.setting) {
	throw Error(`Error with setting definition: ${props.setting}`);
}
const value_ref: Ref<boolean> | Ref<number> | Ref<undefined> = ref();

if (props.setting.data_type === "boolean") {
	if (props.setting.value === "true") {
		value_ref.value = true;
	} else {
		value_ref.value = false;
	}
} else if (props.setting.data_type === "number") {
	const val = Number(props.setting.value);
	value_ref.value = val;
} else {
	throw Error(`Invalid data_type for setting: ${props.setting.data_type}`);
}

interface settingStateMutationProps {
	stt_id: number;
	value: string;
}
const settingState = useMutation({
	mutationFn: async (props: settingStateMutationProps) =>
		await set_setting_value(props.stt_id, props.value)
});

watch(value_ref, (new_value, old_value) => {
	console.log("value changed to ", new_value);
	if (new_value === null || new_value === undefined) {
		if (typeof old_value === "number") {
			value_ref.value = Number(old_value);
		} else if (typeof old_value === "boolean") {
			if (old_value) {
				value_ref.value = true;
			} else {
				value_ref.value = false;
			}
		}
	}

	let new_val: string = "";
	if (typeof new_value === "boolean") {
		if (new_value) {
			new_val = "true";
		} else {
			new_val = "false";
		}
	} else if (typeof new_value === "number") {
		if (new_value <= 1) {
			console.error("New value null or zero");
			value_ref.value = Number(old_value);
		} else {
			new_val = String(new_value);
		}
	}

	if (new_val === "") {
		return;
	}
	settingState.mutate({ stt_id: props.setting.id, value: new_val });
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
