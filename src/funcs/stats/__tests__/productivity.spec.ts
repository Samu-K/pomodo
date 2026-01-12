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
		// Timezone note: The function uses `fromUTCString` which results in local time.
		// For deterministic tests we assume local time is consistent or we invoke `fromUTCString` to check expected hour.
		// But wait, the function takes `Session[]` which has `start_time` as string.
		// `fromUTCString` logic: if ends with Z, treat as UTC.

		// To make this test simpler and robust against test runner timezone,
		// we can mock `fromUTCString` or construct `start_time` carefully.

		// Let's use a known local date string format for the test input if possible,
		// but `fromUTCString` expects ISO-like.

		// Better approach: Since `calculateHourlyDistribution` uses `fromUTCString` (which does `new Date(string)`),
		// we'll rely on the fact that `2024-01-01T10:00:00` (without Z) is treated as local time in many comparisons,
		// OR we adjust expectations to the local timezone.

		// Wait, `fromUTCString` ensures it ends with Z.
		// So "2024-01-01T10:15:00" -> "2024-01-01T10:15:00Z" -> UTC time.
		// Then `startDate.getHours()` gets LOCAL hour.
		// If I run this in UTC environment, 10Z is 10.
		// If I run in +2, 10Z is 12.

		// To verify logic independent of timezone, let's construct sessions such that we know the local hour.
		// But we can't easily control "Local Hour" from `start_time` string without knowing the offset.

		// Workaround: We can check if the logic *distributes* correctly relative to the *start hour*.
		// But the array is fixed 0-23.

		// Let's just create a date object, get its local ISO string, and use that.
		// Actually, `fromUTCString` forces `Z` at the end if missing.

		// Let's assume the test runner is in a specific timezone or we accept whatever hour it lands in.
		// We'll calculate expected hour dynamically.
		const date = new Date("2024-01-01T10:15:00Z");
		const localHour = date.getHours(); // e.g. 12 if +2

		const result = calculateHourlyDistribution(sessions as Session[], true);

		expect(result[localHour]).toBe(30);
		expect(result[(localHour + 1) % 24]).toBe(0);
	});

	it("should split session spanning two hours (User Case: 08:30 + 45m)", () => {
		// 08:30 UTC + 45m -> 08:30 to 09:15 UTC
		// Logic: 30m in 08, 15m in 09 (in UTC terms).
		// In local time, it shifts but relative split is same.

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
		// Assumption: s2 lands in same local hour (24h later usually does, unless DST shift)

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
