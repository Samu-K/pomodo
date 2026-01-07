import { mount } from "@vue/test-utils";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Session } from "../../../funcs/commands";
import GamificationStats from "../GamificationStats.vue";

describe("GamificationStats", () => {
	const mockDate = new Date("2024-01-10T12:00:00"); // Wednesday

	beforeAll(() => {
		vi.useFakeTimers();
		vi.setSystemTime(mockDate);
	});

	afterAll(() => {
		vi.useRealTimers();
	});

	it("renders correct initial stats when empty", () => {
		const wrapper = mount(GamificationStats, {
			props: {
				data: []
			}
		});
		expect(wrapper.text()).toContain("Lifetime Stats");
		expect(wrapper.text()).toContain("0"); // Streak
		expect(wrapper.text()).toContain("0.0h"); // Hours
		expect(wrapper.text()).toContain("0"); // Sessions
	});

	function createMockSession(overrides: Partial<Session>): Session {
		return {
			id: null,
			start_time: "",
			duration: 0,
			finished: false,
			category_id: null,
			task_id: null,
			project_id: null,
			notes: null,
			created_at: null,
			last_modified: null,
			...overrides
		};
	}

	it("calculates total hours and sessions correctly", () => {
		const data: Session[] = [
			createMockSession({
				id: 1,
				finished: true,
				duration: 3600,
				start_time: new Date("2024-01-10").toISOString(),
				category_id: 1
			}),
			createMockSession({
				id: 2,
				finished: true,
				duration: 1800,
				start_time: new Date("2024-01-10").toISOString(),
				category_id: 1
			}),
			createMockSession({
				id: 3,
				finished: false,
				duration: 100,
				start_time: new Date("2024-01-10").toISOString(),
				category_id: 1
			}) // Ignored
		];

		const wrapper = mount(GamificationStats, {
			props: { data }
		});

		// 3600 + 1800 = 5400s = 1.5h
		expect(wrapper.text()).toContain("1.5h");
		expect(wrapper.text()).toContain("2"); // Sessions (only finished)
	});

	it("calculates streak correctly: active today", () => {
		// Today is Jan 10
		const data: Session[] = [
			createMockSession({
				finished: true,
				duration: 10,
				start_time: new Date("2024-01-10").toISOString()
			}), // Today
			createMockSession({
				finished: true,
				duration: 10,
				start_time: new Date("2024-01-09").toISOString()
			}), // Yesterday
			createMockSession({
				finished: true,
				duration: 10,
				start_time: new Date("2024-01-08").toISOString()
			}) // Day before
		];

		const wrapper = mount(GamificationStats, { props: { data } });
		expect(wrapper.text()).toContain("3"); // Streak
	});

	it("calculates streak correctly: active yesterday (valid streak)", () => {
		// Today is Jan 10. No session today.
		const data: Session[] = [
			createMockSession({
				finished: true,
				duration: 10,
				start_time: new Date("2024-01-09").toISOString()
			}), // Yesterday
			createMockSession({
				finished: true,
				duration: 10,
				start_time: new Date("2024-01-08").toISOString()
			}), // Day before
			createMockSession({
				finished: true,
				duration: 10,
				start_time: new Date("2024-01-07").toISOString()
			})
		];

		const wrapper = mount(GamificationStats, { props: { data } });
		expect(wrapper.text()).toContain("3"); // Streak
	});

	it("calculates streak correctly: broken streak", () => {
		// Today is Jan 10. Missing Jan 9.
		const data: Session[] = [
			createMockSession({
				finished: true,
				duration: 10,
				start_time: new Date("2024-01-10").toISOString()
			}), // Today
			createMockSession({
				finished: true,
				duration: 10,
				start_time: new Date("2024-01-08").toISOString()
			}) // Gap on Jan 9
		];

		const wrapper = mount(GamificationStats, { props: { data } });
		expect(wrapper.text()).toContain("1"); // Only today counts
	});

	it("calculates streak correctly: broken streak from yesterday", () => {
		// Today is Jan 10. No session today.
		// Session on Jan 8. Gap on Jan 9.
		const data: Session[] = [
			createMockSession({
				finished: true,
				duration: 10,
				start_time: new Date("2024-01-08").toISOString()
			})
		];

		const wrapper = mount(GamificationStats, { props: { data } });
		expect(wrapper.text()).toContain("0"); // Streak broken
	});
});
