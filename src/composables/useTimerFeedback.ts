import { getCurrentWindow } from "@tauri-apps/api/window";
import { vibrate } from "@tauri-apps/plugin-haptics";
import {
	cancel,
	isPermissionGranted,
	requestPermission,
	Schedule,
	sendNotification
} from "@tauri-apps/plugin-notification";
import { useSettingsStore } from "../stores/settings";

export function useTimerFeedback() {
	const settingsStore = useSettingsStore();

	const TIMER_NOTIFICATION_ID = 88888;

	const playSound = (isFocus: boolean) => {
		const soundsEnabled = settingsStore.settings.find(
			(s) => s.key === "Sound Alerts"
		)?.value;

		if (soundsEnabled === "true" && typeof Audio !== "undefined") {
			const audio = new Audio(isFocus ? "/ding.wav" : "/gong.wav");
			audio.play().catch((e) => console.error("Error playing sound:", e));
		}
	};

	const triggerHaptics = async (isFocus: boolean) => {
		const vibrationEnabled = settingsStore.settings.find(
			(s) => s.key === "Vibration"
		)?.value;

		if (vibrationEnabled === "true") {
			try {
				if (isFocus) {
					await vibrate(500);
				} else {
					await vibrate(200);
					setTimeout(async () => {
						await vibrate(200);
					}, 300);
				}
			} catch (e) {
				console.error("Error vibrating:", e);
			}
		}
	};

	const sendTimerNotification = async (isFocus: boolean) => {
		// Skip notification if window is focused (user is actively using the app)
		try {
			const isFocused = await getCurrentWindow().isFocused();
			if (isFocused) {
				return;
			}
		} catch {
			// If we can't determine focus state, proceed with notification
		}

		const notificationsEnabled = settingsStore.settings.find(
			(s) => s.key === "Push notifications"
		)?.value;

		if (notificationsEnabled === "true") {
			try {
				let permissionGranted = await isPermissionGranted();
				if (!permissionGranted) {
					const permission = await requestPermission();
					permissionGranted = permission === "granted";
				}

				if (permissionGranted) {
					if (isFocus) {
						sendNotification({
							title: "Focus Session Complete",
							body: "Great job! Time for a break."
						});
					} else {
						sendNotification({
							title: "Break Finished",
							body: "Time to get back to work!"
						});
					}
				}
			} catch (error) {
				console.error("Error in notification logic:", error);
			}
		}
	};

	const triggerAllFeedback = async (isFocus: boolean) => {
		playSound(isFocus);
		await triggerHaptics(isFocus);
		await sendTimerNotification(isFocus);
	};

	const scheduleFinishedNotification = async (
		isFocus: boolean,
		delayMs: number
	) => {
		const notificationsEnabled = settingsStore.settings.find(
			(s) => s.key === "Push notifications"
		)?.value;

		if (notificationsEnabled === "true") {
			try {
				let permissionGranted = await isPermissionGranted();
				if (!permissionGranted) {
					const permission = await requestPermission();
					permissionGranted = permission === "granted";
				}

				if (permissionGranted) {
					// Cancel any existing scheduled notifications first to be safe
					await cancel([TIMER_NOTIFICATION_ID]);

					const title = isFocus ? "Focus Session Complete" : "Break Finished";
					const body = isFocus
						? "Great job! Time for a break."
						: "Time to get back to work!";

					await sendNotification({
						id: TIMER_NOTIFICATION_ID,
						title,
						body,
						schedule: Schedule.at(new Date(Date.now() + delayMs))
					});
				}
			} catch (error) {
				console.error("Error scheduling notification:", error);
			}
		}
	};

	const cancelScheduledNotification = async () => {
		try {
			await cancel([TIMER_NOTIFICATION_ID]);
		} catch (error) {
			console.error("Error cancelling notification:", error);
		}
	};

	return {
		playSound,
		triggerHaptics,
		sendTimerNotification,
		triggerAllFeedback,
		scheduleFinishedNotification,
		cancelScheduledNotification
	};
}
