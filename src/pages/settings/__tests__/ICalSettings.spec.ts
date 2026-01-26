import { createTestingPinia } from "@pinia/testing";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { Setting } from "../../../funcs/commands/types";
import {
	commonIconStubs,
	VDialogStub,
	vuetify
} from "../../../test/test-helpers";
import ICalSettings from "../components/ICalSettings.vue";

vi.mock("lucide-vue-next", () => ({
	Calendar: commonIconStubs.Calendar,
	Copy: commonIconStubs.Copy,
	ExternalLink: commonIconStubs.ExternalLink
}));

// Mock crypto
Object.defineProperty(global, "crypto", {
	value: {
		randomUUID: vi.fn(() => "test-uuid-1234")
	},
	writable: true
});

describe("ICalSettings.vue", () => {
	const mockSettings: Setting[] = [
		{
			id: 10,
			key: "iCal sync enabled",
			value: "false",
			category_id: 1,
			data_type: "boolean",
			description: null
		},
		{
			id: 11,
			key: "iCal sync token",
			value: "",
			category_id: 1,
			data_type: "string",
			description: null
		},
		{
			id: 12,
			key: "iCal sync URL",
			value: "",
			category_id: 1,
			data_type: "string",
			description: null
		}
	];

	const factory = (settings = mockSettings) => {
		return mount(ICalSettings, {
			props: {
				settings: settings,
				isPremium: true
			},
			global: {
				plugins: [
					createTestingPinia({ createSpy: vi.fn, stubActions: true }),
					vuetify
				],
				stubs: {
					VDialog: VDialogStub,
					ConfirmationModal: {
						template: "<div></div>",
						emits: ["primary", "secondary", "close"]
					}
				}
			}
		});
	};

	it("computes icalFeedUrl correctly", () => {
		const settings: Setting[] = [
			{
				id: 11,
				key: "iCal sync token",
				value: "token123",
				category_id: 1,
				data_type: "string",
				description: null
			},
			{
				id: 12,
				key: "iCal sync URL",
				value: "https://example.com/",
				category_id: 1,
				data_type: "string",
				description: null
			}
		];
		const wrapper = factory(settings);
		expect((wrapper.vm as unknown as { icalFeedUrl: string }).icalFeedUrl).toBe(
			"https://example.com/cal/token123"
		);
	});

	it("enabling iCal sync updates settings and emits save", async () => {
		const wrapper = factory();

		await (
			wrapper.vm as unknown as { handleEnableICal: () => Promise<void> }
		).handleEnableICal();

		const updates = wrapper.emitted("update-setting");
		expect(updates).toContainEqual(["iCal sync enabled", "true"]);
		expect(updates).toContainEqual(["iCal sync token", "test-uuid-1234"]);
		expect(wrapper.emitted("save-all")).toBeTruthy();
	});

	it("disabling iCal sync updates setting after confirmation", async () => {
		const settings: Setting[] = [
			{
				id: 10,
				key: "iCal sync enabled",
				value: "true",
				category_id: 1,
				data_type: "boolean",
				description: null
			}
		];
		const wrapper = factory(settings);

		await (
			wrapper.vm as unknown as { confirmDisableICal: () => Promise<void> }
		).confirmDisableICal();

		expect(wrapper.emitted("update-setting")).toContainEqual([
			"iCal sync enabled",
			"false"
		]);
		expect(wrapper.emitted("save-all")).toBeTruthy();
	});
});
