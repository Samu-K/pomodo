import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { Setting } from "../../../funcs/commands/types";
import {
	commonIconStubs,
	VDialogStub,
	vuetify
} from "../../../test/test-helpers";
import TimerPresets from "../components/TimerPresets.vue";

vi.mock("lucide-vue-next", () => ({
	LayoutGrid: commonIconStubs.LayoutGrid,
	Save: commonIconStubs.Save,
	X: commonIconStubs.X
}));

describe("TimerPresets.vue", () => {
	const mockSettings: Setting[] = [
		{
			id: 1,
			key: "Focus Duration",
			value: "25",
			category_id: 1,
			data_type: "number",
			description: null
		},
		{
			id: 2,
			key: "Short Break Time",
			value: "5",
			category_id: 1,
			data_type: "number",
			description: null
		},
		{
			id: 3,
			key: "Long Break Interval",
			value: "4",
			category_id: 1,
			data_type: "number",
			description: null
		},
		{
			id: 4,
			key: "Long Break Time",
			value: "15",
			category_id: 1,
			data_type: "number",
			description: null
		},
		{
			id: 5,
			key: "Timer Presets",
			value: "[]",
			category_id: 1,
			data_type: "string",
			description: null
		}
	];

	const factory = () => {
		return mount(TimerPresets, {
			props: {
				settings: mockSettings
			},
			global: {
				plugins: [vuetify],
				stubs: {
					VDialog: VDialogStub,
					VTextField: {
						props: ["modelValue"],
						template:
							'<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
					}
				}
			}
		});
	};

	it("applies a preset correctly", async () => {
		const wrapper = factory();
		const preset = {
			name: "Test",
			focus: 50,
			rest: 10,
			interval: 2,
			longRest: 30
		};

		// We call the internal method for unit test since it's a menu
		await (
			wrapper.vm as unknown as {
				applyPreset: (p: typeof preset) => Promise<void>;
			}
		).applyPreset(preset);

		const updates = wrapper.emitted("update-setting");
		expect(updates).toContainEqual(["Focus Duration", "50"]);
		expect(updates).toContainEqual(["Short Break Time", "10"]);
		expect(wrapper.emitted("change")).toBeTruthy();
	});

	it("saves a new custom preset", async () => {
		const wrapper = factory();
		const vm = wrapper.vm as unknown as {
			presetName: string;
			handleSavePreset: () => Promise<void>;
		};
		vm.presetName = "Deep Work";

		await vm.handleSavePreset();

		const updates = wrapper.emitted("update-setting");
		const presetsUpdate = updates?.find((u) => u[0] === "Timer Presets");
		expect(presetsUpdate).toBeDefined();
		if (presetsUpdate?.[1]) {
			const presets = JSON.parse(presetsUpdate[1] as string);
			expect(presets[0].name).toBe("Deep Work");
			expect(presets[0].focus).toBe(25);
		}
	});

	it("deletes a preset", async () => {
		const customSettings: Setting[] = [
			...mockSettings.slice(0, 4),
			{
				id: 5,
				key: "Timer Presets",
				value: JSON.stringify([{ name: "To Delete", focus: 10 }]),
				category_id: 1,
				data_type: "string",
				description: null
			}
		];
		const wrapper = mount(TimerPresets, {
			props: { settings: customSettings },
			global: { plugins: [vuetify], stubs: { VDialog: VDialogStub } }
		});

		await (
			wrapper.vm as unknown as { deletePreset: (i: number) => Promise<void> }
		).deletePreset(0);

		const updates = wrapper.emitted("update-setting");
		const presetsUpdate = updates?.find((u) => u[0] === "Timer Presets");
		expect(presetsUpdate?.[1]).toBe("[]");
	});
});
