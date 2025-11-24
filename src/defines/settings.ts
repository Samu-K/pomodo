import type { Ref } from "vue";
export interface Setting {
	id: number;
	key: string;
	description: string | undefined;
	value: string;
	category_id: number;
	data_type: string;
}

export interface SettingCategory {
	id: number;
	name: string;
}

export interface SettingRef {
	key: string;
	description: string | undefined;
	value: string;
	dataRef: Ref<number> | Ref<boolean>;
}
