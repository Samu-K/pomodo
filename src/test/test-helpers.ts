import { vi } from "vitest";
import { computed, ref, watch } from "vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

/**
 * Common stubs for browser APIs not available in JSDOM
 */
export function setupBrowserMocks() {
	// Mock ResizeObserver
	vi.stubGlobal(
		"ResizeObserver",
		class ResizeObserver {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);

	// Mock IntersectionObserver
	vi.stubGlobal(
		"IntersectionObserver",
		class IntersectionObserver {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);

	// Mock Animation Frame
	vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
		setTimeout(cb, 0)
	);
	vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));

	// Mock CSS supports
	vi.stubGlobal("CSS", { supports: () => false });

	// Mock MatchMedia
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn()
		}))
	});

	// Mock window dimensions
	const dimensions = { width: 1024, height: 768 };

	Object.defineProperty(window, "innerWidth", {
		writable: true,
		configurable: true,
		value: dimensions.width
	});
	Object.defineProperty(window, "innerHeight", {
		writable: true,
		configurable: true,
		value: dimensions.height
	});
	Object.defineProperty(document.documentElement, "clientWidth", {
		writable: true,
		configurable: true,
		value: dimensions.width
	});
	Object.defineProperty(document.documentElement, "clientHeight", {
		writable: true,
		configurable: true,
		value: dimensions.height
	});
}

/**
 * Common Lucide icon stubs
 */
export const commonIconStubs = {
	MinusCircle: { template: '<svg class="lucide-minus-circle"></svg>' },
	PlusCircle: { template: '<svg class="lucide-plus-circle"></svg>' },
	Calendar: { template: '<svg class="lucide-calendar"></svg>' },
	ChevronLeft: { template: '<svg class="lucide-chevron-left"></svg>' },
	ChevronRight: { template: '<svg class="lucide-chevron-right"></svg>' },
	Plus: { template: '<svg class="lucide-plus"></svg>' },
	Trash2: { template: '<svg class="lucide-trash-2"></svg>' },
	X: { template: '<svg class="lucide-x"></svg>' },
	Save: { template: '<svg class="lucide-save"></svg>' },
	Copy: { template: '<svg class="lucide-copy"></svg>' },
	ExternalLink: { template: '<svg class="lucide-external-link"></svg>' },
	Play: { template: '<svg class="lucide-play"></svg>' },
	Pause: { template: '<svg class="lucide-pause"></svg>' },
	Maximize2: { template: '<svg class="lucide-maximize-2"></svg>' },
	Minimize2: { template: '<svg class="lucide-minimize-2"></svg>' },
	Cloud: { template: '<svg class="lucide-cloud"></svg>' },
	FileJson: { template: '<svg class="lucide-file-json"></svg>' },
	FileSpreadsheet: { template: '<svg class="lucide-file-spreadsheet"></svg>' },
	Lock: { template: '<svg class="lucide-lock"></svg>' },
	RotateCcw: { template: '<svg class="lucide-rotate-ccw"></svg>' },
	SkipForward: { template: '<svg class="lucide-skip-forward"></svg>' },
	LayoutGrid: { template: '<svg class="lucide-layout-grid"></svg>' }
};

/**
 * Vuetify instance for tests
 */
export const vuetify = createVuetify({
	components,
	directives
});

/**
 * Shared VDialog stub that works in test environment
 */
export const VDialogStub = {
	props: ["modelValue"],
	emits: ["update:modelValue"],
	setup(
		// biome-ignore lint/suspicious/noExplicitAny: Necessary for Vue Test Utils stub compatibility
		props: any,
		// biome-ignore lint/suspicious/noExplicitAny: Necessary for Vue Test Utils stub compatibility
		{ emit }: any
	) {
		const isOpen = ref(props.modelValue);

		watch(
			() => props.modelValue,
			(newVal: boolean) => {
				isOpen.value = newVal;
			}
		);

		const open = () => {
			isOpen.value = true;
			emit("update:modelValue", true);
		};

		const isActive = computed({
			get: () => isOpen.value,
			set: (val: boolean) => {
				isOpen.value = val;
				emit("update:modelValue", val);
			}
		});

		return { isOpen, open, isActive };
	},
	template: `
		<div>
			<slot name="activator" :props="{ onClick: open }"></slot>
			<div v-if="isOpen" class="v-dialog-content">
				<slot :isActive="isActive"></slot>
			</div>
		</div>
	`
};
