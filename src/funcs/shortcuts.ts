import { register, unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import { useSettingsStore } from "../stores/settings";
import { useTimerStore } from "../stores/timer";

export async function registerShortcuts() {
	const timer = useTimerStore();
	const settingsStore = useSettingsStore();

	// Ensure settings are loaded
	if (settingsStore.settings.length === 0) {
		await settingsStore.fetchSettings();
	}

	const toggleShortcut =
		settingsStore.settings.find((s) => s.key === "Toggle Timer")?.value ||
		"CommandOrControl+Alt+P";

	try {
		await unregisterAll();

		// Toggle Timer
		await register(toggleShortcut, async (event) => {
			if (event.state === "Pressed") {
				timer.toggleTimer();
			}
		});
	} catch (error) {
		console.error("Failed to register global shortcuts:", error);
	}
}

export async function unregisterShortcuts() {
	try {
		await unregisterAll();
	} catch (error) {
		console.error("Failed to unregister global shortcuts:", error);
	}
}
