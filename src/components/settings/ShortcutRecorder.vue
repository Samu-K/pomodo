<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

const props = defineProps<{
	modelValue: string;
	label?: string;
}>();

const emit = defineEmits<(e: "update:modelValue", value: string) => void>();

const isRecording = ref(false);
const currentKeys = ref<Set<string>>(new Set());

// Map of JS event keys to Tauri shortcut names
const KEY_MAP: Record<string, string> = {
	" ": "Space",
	Control: "CommandOrControl",
	Meta: "Super",
	ArrowUp: "Up",
	ArrowDown: "Down",
	ArrowLeft: "Left",
	ArrowRight: "Right"
};

// Reverse map for display
const DISPLAY_MAP: Record<string, string> = {
	CommandOrControl: "Ctrl",
	Super: "Win"
};

const displayShortcut = computed(() => {
	if (!props.modelValue) return ["None"];
	return props.modelValue.split("+").map((k) => DISPLAY_MAP[k] || k);
});

const startRecording = () => {
	isRecording.value = true;
	currentKeys.value.clear();
	window.addEventListener("keydown", handleKeyDown);
	window.addEventListener("keyup", handleKeyUp);
};

const stopRecording = () => {
	isRecording.value = false;
	currentKeys.value.clear();
	window.removeEventListener("keydown", handleKeyDown);
	window.removeEventListener("keyup", handleKeyUp);
};

const handleKeyDown = (e: KeyboardEvent) => {
	e.preventDefault();
	e.stopPropagation();

	// Reset if this is a new combination starting
	if (currentKeys.value.size === 0) {
		// Nothing to do
	}

	let key = e.key;

	// Format modifiers
	if (key === "Control") key = "CommandOrControl";
	if (key === "Meta") key = "Super"; // Windows key
	if (key.length === 1) key = key.toUpperCase();
	if (KEY_MAP[key]) key = KEY_MAP[key];
	if (KEY_MAP[e.code]) key = KEY_MAP[e.code]; // Fallback to code for special keys sometimes

	currentKeys.value.add(key);

	// Check if we have a valid combination (at least one modifier and one non-modifier, or just function keys)
	// Simple heuristic: If the last pressed key is NOT a modifier, we might be done.
	const modifiers = ["CommandOrControl", "Alt", "Shift", "Super"];
	const hasModifier = Array.from(currentKeys.value).some((k) =>
		modifiers.includes(k)
	);
	const lastKey = key;
	const isModifier = modifiers.includes(lastKey);

	if (hasModifier && !isModifier) {
		saveShortcut();
	}
};

const handleKeyUp = (_e: KeyboardEvent) => {
	// Optional: could use this to finalize recording if we want to support holding down keys
};

const saveShortcut = () => {
	// Sort keys: Modifiers first (Ctrl > Alt > Shift > Super), then Key
	const modifiers = ["CommandOrControl", "Alt", "Shift", "Super"];
	const keys = Array.from(currentKeys.value);

	// Filter out duplicates just in case
	const uniqueKeys = [...new Set(keys)];

	const sorted = uniqueKeys.sort((a, b) => {
		const aIsMod = modifiers.includes(a);
		const bIsMod = modifiers.includes(b);
		if (aIsMod && !bIsMod) return -1;
		if (!aIsMod && bIsMod) return 1;
		if (aIsMod && bIsMod) return modifiers.indexOf(a) - modifiers.indexOf(b);
		return 0;
	});

	const shortcutString = sorted.join("+");
	emit("update:modelValue", shortcutString);
	stopRecording();
};

onBeforeUnmount(() => {
	stopRecording();
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <div 
      @click="startRecording"
      class="flex items-center justify-between p-3 rounded-lg border border-light-border dark:border-dark-border cursor-pointer hover:bg-light-surface/50 dark:hover:bg-dark-surface/50 transition-colors"
      :class="{ 'ring-2 ring-pomodo-orange border-transparent': isRecording }"
    >
      <span class="text-sm font-medium text-lightText-primary dark:text-white">{{ label || 'Shortcut' }}</span>
      <div class="flex gap-1" v-if="!isRecording">
        <kbd 
          v-for="key in displayShortcut" 
          :key="key"
          class="px-2 py-1 text-xs font-mono bg-light-surface dark:bg-dark-surface rounded border border-light-border dark:border-dark-border text-lightText-muted dark:text-text-muted min-w-[24px] text-center"
        >
          {{ key }}
        </kbd>
      </div>
      <div v-else class="text-xs text-pomodo-orange font-bold animate-pulse">
        Recording...
      </div>
    </div>

    <!-- Modal Overlay for Recording -->
    <Teleport to="body">
      <div 
        v-if="isRecording"
        class="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center"
        @click.self="stopRecording"
      >
        <div class="bg-light-bg dark:bg-dark-bg p-8 rounded-2xl shadow-xl border border-light-border dark:border-dark-border flex flex-col items-center gap-6 max-w-sm w-full mx-4">
          <h3 class="text-lg font-bold text-lightText-primary dark:text-white">Press shortcut to register</h3>
          
          <div class="flex gap-2 h-12 items-center justify-center">
            <template v-if="currentKeys.size > 0">
                <kbd 
                v-for="key in Array.from(currentKeys)" 
                :key="key"
                class="px-3 py-2 text-sm font-mono bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border text-lightText-primary dark:text-white min-w-[32px] text-center shadow-sm"
                >
                {{ DISPLAY_MAP[key] || key }}
                </kbd>
            </template>
            <span v-else class="text-lightText-muted dark:text-text-muted animate-pulse">Waiting for input...</span>
          </div>

          <div class="flex flex-col gap-2 w-full">
            <button 
                @click="stopRecording" 
                class="w-full py-2 px-4 rounded-lg hover:bg-light-surface dark:hover:bg-dark-surface text-lightText-muted dark:text-text-muted transition-colors text-sm"
            >
                Cancel
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
