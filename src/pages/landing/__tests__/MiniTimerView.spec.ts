import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { TimerMode } from "../../../stores/timer";
import { commonIconStubs } from "../../../test/test-helpers";
import MiniTimerView from "../components/MiniTimerView.vue";

vi.mock("lucide-vue-next", () => ({
	Maximize2: commonIconStubs.Maximize2,
	Pause: commonIconStubs.Pause,
	Play: commonIconStubs.Play
}));

describe("MiniTimerView.vue", () => {
	const factory = (props = {}) => {
		return mount(MiniTimerView, {
			props: {
				taskId: null,
				projectId: null,
				formattedTime: "25:00",
				themeColor: "pomodo-orange",
				isRunning: false,
				mode: TimerMode.FOCUS,
				canStart: true,
				...props
			}
		});
	};

	it("renders formatted time and theme color", () => {
		const wrapper = factory({ formattedTime: "12:34", themeColor: "green" });
		expect(wrapper.text()).toContain("12:34");
		expect(wrapper.find(".text-green").exists()).toBe(true);
	});

	it("shows task title if present", () => {
		const wrapper = factory({ selectedTaskTitle: "My Task" });
		expect(wrapper.text()).toContain("My Task");
	});

	it("emits toggle-timer when play/pause is clicked", async () => {
		const wrapper = factory();
		await wrapper.find('[data-testid="mini-toggle-timer"]').trigger("click");
		expect(wrapper.emitted("toggle-timer")).toBeTruthy();
	});

	it("emits toggle-mini-mode when maximize is clicked", async () => {
		const wrapper = factory();
		await wrapper.find('[data-testid="mini-maximize"]').trigger("click");
		expect(wrapper.emitted("toggle-mini-mode")).toBeTruthy();
	});
});
