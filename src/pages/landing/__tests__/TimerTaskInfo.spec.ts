import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { TimerMode } from "../../../stores/timer";
import { vuetify } from "../../../test/test-helpers";
import TimerTaskInfo from "../components/TimerTaskInfo.vue";

describe("TimerTaskInfo.vue", () => {
	const factory = (props = {}) => {
		return mount(TimerTaskInfo, {
			props: {
				selectedTask: null,
				selectedProject: null,
				selectedCategory: null,
				showSelector: true,
				mode: TimerMode.FOCUS,
				...props
			},
			global: { plugins: [vuetify] }
		});
	};

	it("shows selector button when showSelector is true", () => {
		const wrapper = factory({ showSelector: true });
		expect(wrapper.find('[data-testid="task-selector"]').exists()).toBe(true);
	});

	it("shows task title when selected", () => {
		const wrapper = factory({
			selectedTask: { title: "Heavy Task" },
			showSelector: false
		});
		expect(wrapper.text()).toContain("Heavy Task");
	});

	it("emits open-manager when button is clicked", async () => {
		const wrapper = factory({ showSelector: true });
		await wrapper.find('[data-testid="task-selector"]').trigger("click");
		expect(wrapper.emitted("open-manager")).toBeTruthy();
	});
});
