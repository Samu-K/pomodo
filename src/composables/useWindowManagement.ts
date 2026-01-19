import {
	currentMonitor,
	getCurrentWindow,
	LogicalSize
} from "@tauri-apps/api/window";
import { watch } from "vue";
import { useUIStore } from "../stores/ui";

export function useWindowManagement() {
	const uiStore = useUIStore();

	const getSafeWindowSize = async () => {
		try {
			const monitor = await currentMonitor();
			if (!monitor) return new LogicalSize(400, 900);

			const scaleFactor = monitor.scaleFactor;
			const screenHeight = monitor.size.height / scaleFactor;

			// Target height is 900, but clamp to 90% of screen height
			const targetHeight = Math.min(900, screenHeight * 0.9);

			// Ensure we don't go below min height (100 in config)
			const finalHeight = Math.max(100, targetHeight);

			return new LogicalSize(400, finalHeight);
		} catch (e) {
			console.debug("Failed to get monitor info (likely not in Tauri env)", e);
			return new LogicalSize(400, 900);
		}
	};

	const initializeWindow = async () => {
		if (!uiStore.isMiniMode && !uiStore.isMobile) {
			try {
				const safeSize = await getSafeWindowSize();
				await getCurrentWindow().setSize(safeSize);
				await getCurrentWindow().center();
			} catch (e) {
				console.debug("Skipping window resize (likely not in Tauri env)", e);
			}
		}
	};

	watch(
		() => uiStore.isMiniMode,
		async (isMini) => {
			if (uiStore.isMobile) return;
			try {
				const appWindow = getCurrentWindow();
				if (isMini) {
					await appWindow.setSize(new LogicalSize(320, 150));
					await appWindow.setAlwaysOnTop(true);
					await appWindow.setResizable(false);
				} else {
					const safeSize = await getSafeWindowSize();
					await appWindow.setSize(safeSize);
					await appWindow.setAlwaysOnTop(false);
					await appWindow.setResizable(true);
					await appWindow.center();
				}
			} catch (e) {
				console.debug("Skipping window resize (likely not in Tauri env)", e);
			}
		}
	);

	return {
		initializeWindow,
		getSafeWindowSize
	};
}
