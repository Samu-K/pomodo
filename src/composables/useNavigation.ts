import { useSwipe } from "@vueuse/core";
import { useRoute, useRouter } from "vue-router";

export function useNavigation() {
	const route = useRoute();
	const router = useRouter();
	const tabs = ["/", "/timeline", "/tasks", "/stats"];

	const navigateTabs = (offset: number) => {
		const current = route.path;
		const idx = tabs.indexOf(current);
		if (idx === -1) return;

		const newIdx = idx + offset;
		if (newIdx >= 0 && newIdx < tabs.length) {
			router.push(tabs[newIdx]);
		}
	};

	useSwipe(document.body, {
		onSwipeEnd(_e: Event, direction: string) {
			if (direction === "left") {
				// Swipe Left -> Go Right (Next Tab)
				navigateTabs(1);
			} else if (direction === "right") {
				// Swipe Right -> Go Left (Prev Tab)
				navigateTabs(-1);
			}
		}
	});

	return {
		navigateTabs
	};
}
