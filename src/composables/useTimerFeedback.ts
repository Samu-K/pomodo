import { vibrate } from "@tauri-apps/plugin-haptics";
import {
	isPermissionGranted,
	requestPermission,
	sendNotification
} from "@tauri-apps/plugin-notification";
import { useSettingsStore } from "../stores/settings";

export function useTimerFeedback() {
	const settingsStore = useSettingsStore();

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

	return {
		playSound,
		triggerHaptics,
		sendTimerNotification,
		triggerAllFeedback
	};
}
