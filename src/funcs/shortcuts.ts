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

	console.log(
		`[Reg] Found toggle shortcut setting: ${toggleShortcut}, all settings length: ${settingsStore.settings.length}`
	);

	try {
		console.log(`[Reg] Unregistering all shortcuts...`);
		await unregisterAll();
		console.log(`[Reg] Registering new shortcut: ${toggleShortcut}`);

		// Toggle Timer
		await register(toggleShortcut, async (event) => {
			if (event.state === "Pressed") {
				console.log(
					`[Reg] Shortcut pressed: ${toggleShortcut} -> Toggling timer`
				);
				timer.toggleTimer();
			}
		});

		console.log(`[Reg] Global shortcuts registered: ${toggleShortcut}`);
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
