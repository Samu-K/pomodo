# Pomodo Project Improvement Roadmap

**Version:** 1.0
**Status:** Planned
**Context:** This document outlines the architectural refactoring, feature additions, and technical debt cleanup required to mature the Pomodo project from a template to a production-ready application.

---

## 1. Architectural Refactoring

### 1.1 Adopt Vue Router - DONE
**Current State:** `App.vue` uses manual state (`activeTab`) and conditional rendering (`v-if`) for navigation.
**Objective:** Replace manual routing with `vue-router` to improve navigation handling, enable lazy loading, and clean up the root component.
**Instructions:**
- Install `vue-router`.
- Create `src/router/index.ts` defining routes for:
  - `/` (Timer)
  - `/timeline`
  - `/tasks`
  - `/stats`
  - `/settings`
- Refactor `AppLayout.vue` to use `<router-view>` instead of slots for content.
- Update bottom navigation to use `router-link` or programmatic navigation.

### 1.2 Extract Logic to Composables
**Current State:** Complex logic (e.g., "Hold to pause") resides directly inside UI components like `TimerScreen.vue`.
**Objective:** Decouple logic from UI to enhance reusability and testability.
**Instructions:**
- Create `src/composables/useHoldAction.ts` to encapsulate the hold-to-trigger logic.
- Refactor `TimerScreen.vue` to import and use this composable.
- Ensure the composable accepts callbacks for `onStart`, `onComplete`, and `onCancel`.

### 1.3 Web Worker for Timer - DONE
**Current State:** The timer relies on `setInterval` running on the main thread in `stores/timer.ts`.
**Objective:** Prevent timer drift and throttling when the application is in the background.
**Instructions:**
- Create a dedicated Web Worker (`src/workers/timer.worker.ts`).
- Move the `tick` logic and interval management into the worker.
- Refactor `stores/timer.ts` to communicate with the worker via messages (`postMessage`).

---

## 2. Feature Completeness

### 2.1 System Notifications & Audio
**Current State:** Sessions finish silently with only a state change.
**Objective:** Alert the user when a focus or break session ends, even if the window is not focused.
**Instructions:**
- Integrate `@tauri-apps/plugin-notification`.
- Trigger a system notification in `timer.ts` inside `handleComplete()`.
- Implement an audio feedback mechanism (e.g., a "ding" sound) using HTML5 Audio or a lightweight library.

### 2.2 Task Management (CRUD)
**Current State:** The "Tasks" tab is a placeholder.
**Objective:** Fully implement the Task interface.
**Instructions:**
- Create `src/pages/tasks/TaskListScreen.vue`.
- Connect UI to the existing Rust backend commands for tasks (ensure commands exist in `src-tauri` or implement them).
- Utilize existing modals:
  - `CreateTaskModal.vue`
  - `TaskDetailsModal.vue`
- Implement grouping by category and "Completed" vs. "Pending" views.

### 2.3 System Tray Integration
**Current State:** No system tray presence.
**Objective:** Allow the app to run in the background and provide quick status updates.
**Instructions:**
- Configure the System Tray in `src-tauri/tauri.conf.json` and Rust backend.
- Features to implement:
  - Show remaining time in the tray tooltip or menu title.
  - "Show/Hide" toggle.
  - "Quit" option.

---

## 3. User Experience (UX) Enhancements

### 3.1 "Focus Mode" / Mini Window
**Objective:** Reduce visual clutter during focus sessions.
**Instructions:**
- Add a toggle to switch the window to a "Mini" compact state.
- In Mini state:
  - Hide navigation and extra controls.
  - Show only the timer and current task.
  - Resize the window using Tauri's window API.

### 3.2 Keyboard Shortcuts
**Objective:** Power-user efficiency.
**Instructions:**
- Implement a global key listener (or Tauri global shortcuts) for:
  - `Space`: Toggle Timer.
  - `Esc`: Cancel/Skip.
  - `Ctrl/Cmd+N`: New Task.

### 3.3 Empty States
**Objective:** Improve UX when data is missing.
**Instructions:**
- Create a reusable `<EmptyState />` component.
- Implement in `StatsScreen` (when no history exists) and `TimelineScreen` (when no tasks are scheduled).

---

## 4. Code Quality & Maintenance

### 4.1 Type-Safe Tauri Commands (Specta)
**Current State:** Commands are invoked using raw strings.
**Objective:** Ensure full type safety between Rust and TypeScript.
**Instructions:**
- Fully implement `tauri-specta` (already present in `Cargo.toml`).
- Generate TypeScript bindings for all Rust commands.
- Replace manual `invoke("command_string")` calls with the generated typed functions.

### 4.2 Centralized Design System
**Current State:** Colors are hardcoded in components like `TimerScreen.vue`.
**Objective:** Single source of truth for styling.
**Instructions:**
- Extract all color codes (hex values) into `src/utils/theme.ts` or a Pinia theme store.
- Update `tailwind.config.js` to reference these variables if dynamic updates are needed.
- Refactor components to use these centralized values instead of hardcoded strings.

### 4.3 Testing Strategy
**Current State:** Basic Vitest setup exists.
**Objective:** Ensure reliability of core logic.
**Instructions:**
- **Unit Tests:** Add comprehensive tests for `stores/timer.ts` covering:
  - Auto-start logic.
  - State persistence.
  - Long break calculations.
- **Component Tests:** Test `TimerScreen.vue` interaction logic using Vue Test Utils.

---

## Technical Constraints & Guidelines
* **Package Manager:** Strictly use **pnpm**.
* **Linter:** Follow **Biome** rules (`biome.json`).
* **UI Framework:** Prioritize **Vuetify** components; use **Tailwind** for layout.
* **Icons:** Use `lucide-vue-next`.
* **Backend:** Do not modify `src-tauri` unless implementing specific required commands for the features above.