import type { Session } from "../commands";
import { fromUTCString } from "./date_handling";

export function calculateHourlyDistribution(
	sessions: Session[],
	forceTotal = false
): number[] {
	const hours = new Array(24).fill(0);
	const uniqueDays = new Set<string>();

	sessions.forEach((s) => {
		if (!s.start_time || !s.duration) return;

		const startDate = fromUTCString(s.start_time);

		// Track active days for divisor (YYYY-MM-DD)
		uniqueDays.add(startDate.toLocaleDateString());

		let currentH = startDate.getHours();
		let currentM = startDate.getMinutes();
		let remainingDurationMinutes = s.duration / 60;

		// Distribute duration across hour buckets
		while (remainingDurationMinutes > 0) {
			// Minutes left in the current hour bucket
			// e.g. at 8:30, 30 mins left in hour 8
			const minutesLeftInHour = 60 - currentM;

			// Take whichever is smaller: remainder or available space
			const contribution = Math.min(
				remainingDurationMinutes,
				minutesLeftInHour
			);

			// Add to bucket (handle 24h wrap-around)
			hours[currentH % 24] += contribution;

			// Update state
			remainingDurationMinutes -= contribution;
			currentH++;
			currentM = 0; // Next hour starts at :00
		}
	});

	// Divisor logic:
	// If forceTotal (e.g. 1D view), we show totals (divisor 1).
	// Otherwise, we show Average Daily Productivity *on active days*.
	const divisor = forceTotal ? 1 : Math.max(1, uniqueDays.size);

	return hours.map((h) => Math.round(h / divisor));
}
