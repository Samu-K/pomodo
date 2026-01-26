import { describe, expect, it } from "vitest";
import type { Session } from "../../commands";
import { calculateHourlyDistribution } from "../productivity";

describe("calculateHourlyDistribution", () => {
	it("should return zeros for empty sessions", () => {
		const result = calculateHourlyDistribution([]);
		expect(result).toHaveLength(24);
		expect(result.every((h) => h === 0)).toBe(true);
	});

	it("should distribute a session fitting in one hour", () => {
		// 10:15 - 10:45 (30m)
		const sessions: Partial<Session>[] = [
			{ start_time: "2024-01-01T10:15:00Z", duration: 30 * 60 }
		];
		const date = new Date("2024-01-01T10:15:00Z");
		const localHour = date.getHours(); // e.g. 12 if +2

		const result = calculateHourlyDistribution(sessions as Session[], true);

		expect(result[localHour]).toBe(30);
		expect(result[(localHour + 1) % 24]).toBe(0);
	});

	it("should split session spanning two hours (User Case: 08:30 + 45m)", () => {
		const start = "2024-01-01T08:30:00Z";
		const sessions: Partial<Session>[] = [
			{ start_time: start, duration: 45 * 60 }
		];

		const date = new Date(start);
		const h1 = date.getHours();
		const h2 = (h1 + 1) % 24;

		const result = calculateHourlyDistribution(sessions as Session[], true);

		expect(result[h1]).toBe(30);
		expect(result[h2]).toBe(15);
	});

	it("should handle session spanning midnight", () => {
		// 23:30 UTC + 60m -> 23:30 to 00:30 UTC
		const start = "2024-01-01T23:30:00Z";
		const sessions: Partial<Session>[] = [
			{ start_time: start, duration: 60 * 60 }
		];

		const date = new Date(start);
		const h1 = date.getHours();
		const h2 = (h1 + 1) % 24;

		const result = calculateHourlyDistribution(sessions as Session[], true);

		expect(result[h1]).toBe(30);
		expect(result[h2]).toBe(30);
	});

	it("should handle active days divisor", () => {
		// 1 day with 60 mins -> 60 avg
		// 2 days, each with 60 mins -> 60 avg (120 total / 2)
		// 2 days, one 60m, one 30m -> 45 avg

		const s1 = "2024-01-01T10:00:00Z";
		const s2 = "2024-01-02T10:00:00Z"; // Different day

		const sessions: Partial<Session>[] = [
			{ start_time: s1, duration: 60 * 60 },
			{ start_time: s2, duration: 30 * 60 }
		];

		const localHour = new Date(s1).getHours();

		const result = calculateHourlyDistribution(sessions as Session[], false); // auto divisor

		// Total minutes: 90. Active days: 2.
		// Avg: 45.
		expect(result[localHour]).toBe(45);
	});

	it("should use divisor 1 when forceTotal is true", () => {
		const s1 = "2024-01-01T10:00:00Z";
		const s2 = "2024-01-02T10:00:00Z";

		const sessions: Partial<Session>[] = [
			{ start_time: s1, duration: 60 * 60 },
			{ start_time: s2, duration: 30 * 60 }
		];

		const localHour = new Date(s1).getHours();

		const result = calculateHourlyDistribution(sessions as Session[], true); // force total

		// Total minutes: 90.
		expect(result[localHour]).toBe(90);
	});
});
