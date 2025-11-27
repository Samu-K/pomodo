import { vi } from 'vitest'

    // Disable Vue Devtools to avoid SecurityError from @vue/devtools-kit
    ; (globalThis as any).__VUE_PROD_DEVTOOLS__ = false

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
}

// Use Object.defineProperty to overwrite the existing property which might be throwing on access
try {
    Object.defineProperty(globalThis, 'localStorage', {
        value: localStorageMock,
        writable: true,
        configurable: true,
    })
} catch (e) {
    console.warn('Failed to mock globalThis.localStorage', e)
}

try {
    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true,
            configurable: true,
        })
    }
} catch (e) {
    console.warn('Failed to mock window.localStorage', e)
}

// Mock Worker
class MockWorker {
    url: string;
    onmessage: (event: MessageEvent) => void;
    
    constructor(stringUrl: string) {
        this.url = stringUrl;
        this.onmessage = () => {};
    }

    postMessage(msg: any) {
        // Default no-op
    }

    terminate() {
        // Default no-op
    }
}

global.Worker = MockWorker as any;
