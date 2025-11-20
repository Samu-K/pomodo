// Helper to check if a date string is "Today"
const isToday = (dateString: string | null) => {
	if (!dateString) return false; // Null check
	const d = new Date(dateString);
	const today = new Date();
	return (
		d.getDate() === today.getDate() &&
		d.getMonth() === today.getMonth() &&
		d.getFullYear() === today.getFullYear()
	);
};

// Helper to check if a date is in the "Current Week"
const isSameWeek = (dateString: string | null) => {
	if (!dateString) return false; // Null check
	const d = new Date(dateString);
	const today = new Date();

	// Adjust to make Monday index 0, Sunday index 6
	const dayOfWeek = (today.getDay() + 6) % 7;

	const startOfWeek = new Date(today);
	startOfWeek.setDate(today.getDate() - dayOfWeek);
	startOfWeek.setHours(0, 0, 0, 0);

	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setDate(startOfWeek.getDate() + 6);
	endOfWeek.setHours(23, 59, 59, 999);

	return d >= startOfWeek && d <= endOfWeek;
};

// Helper to format seconds into "Xh Ym"
const formatDuration = (seconds: number) => {
	// Optional: Round to nearest minute so 59s doesn't look empty
	if (seconds < 60) return "0m";

	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);

	if (h > 0 && m > 0) return `${h}h ${m}m`;
	if (h > 0) return `${h}h`;
	return `${m}m`;
};

export { formatDuration, isSameWeek, isToday };
