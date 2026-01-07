// Helper to check if a date string is "Today"
const isToday = (date: Date | string | null) => {
	if (!date) return false; // Null check
	const d = date instanceof Date ? date : new Date(date);
	const today = new Date();
	return (
		d.getDate() === today.getDate() &&
		d.getMonth() === today.getMonth() &&
		d.getFullYear() === today.getFullYear()
	);
};

// Helper to check if a date is in the "Current Week"
const isSameWeek = (date: Date | string | null) => {
	if (!date) return false; // Null check
	const d = date instanceof Date ? date : new Date(date);
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

// Helper to get local ISO string (YYYY-MM-DDTHH:mm:ss)
const toLocalISOString = (date: Date): string => {
	const offset = date.getTimezoneOffset() * 60000;
	const localTime = new Date(date.getTime() - offset);
	return localTime.toISOString().slice(0, 19);
};

// Helper to get UTC ISO string for backend
const toUTCISOString = (date: Date): string => {
	return date.toISOString().slice(0, 19);
};

// Helper to create a local Date from a UTC string from backend
const fromUTCString = (utcString: string | null): Date => {
	if (!utcString) return new Date();
	// If it doesn't end with Z, append it so Date() treats it as UTC
	const normalized = utcString.endsWith("Z") ? utcString : `${utcString}Z`;
	return new Date(normalized);
};

export {
	formatDuration,
	isSameWeek,
	isToday,
	toLocalISOString,
	toUTCISOString,
	fromUTCString
};
