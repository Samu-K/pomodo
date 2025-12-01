# Pomodo Project Roadmap

**Version:** 6.0 (Tasks & Recurrence)
**Context:** This document outlines the path to maturing Pomodo from a template into a production-ready, cross-platform (Desktop, iOS, Android) application.

---

## ✅ Completed / In-Progress
- **Routing:** Migrated to `vue-router`.
- **Timer Logic:** Moved to Web Workers for background stability.
- **Type Safety:** Implemented `tauri-specta` for typesafe commands.
- **Design System:** Centralized theme colors.

---

## 🏗 Phase 1: Core Architecture & Refactoring

### 1.2 Platform Detection
- **Goal:** Runtime logic for UI differences.
- **Implementation:** `src/composables/usePlatform.ts` (flags for mobile/desktop).

---

## 📝 Phase 2: Task Management (The "Meat")
*Adding structure to the workflow.*

### 2.1 Database Schema
- **Goal:** Support one-time and complex recurring tasks.
- **Implementation:**
  - Update `tasks` table: `title`, `category_id`, `est_pomodoros`, `start_datetime`.
  - **Recurrence:** Add `rrule` column (String) to store iCal-compliant recurrence rules.

### 2.2 Recurrence Logic (Frontend)
- **Goal:** Flexible scheduling (e.g., "Every Mon/Wed").
- **Tech:** Use `rrule` (npm package) for parsing and generating rule strings.
- **Flow:**
  - **Creation:** Convert UI form state -> RRULE string.
  - **Display:** Use `rrule.between()` to calculate visible tasks for the Timeline view.

### 2.3 Task Selection Flow (Timer Screen)
- **Goal:** Context-aware focus.
- **New UX:**
  1. User clicks "Select Task".
  2. **Step 1:** Pick Category (e.g., "Work").
  3. **Step 2:** Pick specific Task (sorted by date) OR "Just Focus" (category only).
  4. **Result:** Timer session is linked to both Category ID and Task ID.

---

## 📱 Phase 3: Mobile Core & "Feel"

### 3.1 Startup Experience
- **Implementation:** `splashscreen.html` configured in Tauri to hide initialization.

### 3.2 "Always On" Focus
- **Implementation:** `tauri-plugin-keep-screen-on` enabled during Focus Mode.

### 3.3 Tactile Feedback
- **Implementation:** `tauri-plugin-haptic-feedback` for interactions.

### 3.4 Navigation Gestures
- **Implementation:** Swipe Left/Right navigation using `@vueuse/core`.

---

## 🎨 Phase 4: UI/UX Refinements

### 4.1 Unified Interaction
- **Action:** Remove `:hover` states; rely on `:active` for cross-platform consistency.

### 4.2 Visual Polish
- **Timer Screen:** Clearer Enabled/Disabled button states.
- **Empty States:** Friendly placeholders for empty lists/charts.
- **OLED Theme:** True Black mode for mobile battery savings.

---

## 🚀 Phase 5: Background & Notifications

### 5.1 iOS: Live Activities
- **Implementation:** Custom Swift Plugin + Widget Extension for Lock Screen timer.

### 5.2 Android: Foreground Service
- **Implementation:** Custom Kotlin Plugin starting a Foreground Service with `.setUsesChronometer(true)`.

### 5.3 Interactive Notifications
- **Implementation:** "Start Break" / "Pause" buttons directly in system notifications.

---

## 🖥️ Phase 6: Desktop Quality of Life

### 6.1 Window Management
- **Persistence:** Save/Restore window size/position.
- **Mini-Mode:** Toggle small, always-on-top window.
- **Minimize to Tray:** Keep running in background on close.

### 6.2 Context Menus
- **Implementation:** Right-click menus for Task editing and Timer control.

### 6.3 Global Hotkeys
- **Implementation:** `Ctrl+Shift+P` to toggle timer globally.

---

## ✨ Phase 7: Gamification & Data

### 7.1 Stats Screen
- **Metrics:** Track "Daily Streak" and "Total Focus Hours".
- **Implementation:** Aggregations in `src/stores/stats.ts`.

### 7.2 Data Backup
- **Implementation:** JSON Export/Import of SQLite DB.