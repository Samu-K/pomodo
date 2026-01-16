# Project Context & Guidelines

This document serves as a reference for the AI assistant (Antigravity) to understand the project's constraints, style, and preferences.

## 🛠 Tech Stack

- **Core**: Vue 3 (Composition API)
- **Desktop Framework**: Tauri v2
- **UI Framework**: Vuetify 3 (Primary)
- **Styling**: Tailwind CSS (Utilities & Custom Theme)
- **State Management**: Pinia
- **Build Tool**: Vite
- **Package Manager**: **pnpm** (Strictly enforced)
- **Linter/Formatter**: Biome

## 🎨 Color Scheme

The project uses a specific color palette defined in `tailwind.config.js`.

### Brand Colors (Pomodo)
- **Orange**: `#b8744f` (Primary Brand Color)
- **Red**: `#c75450`
- **Gold**: `#d4a373`
- **Brown**: `#8b5a3c`

### Dark Theme Colors
- **Background**: `#1a1a1a`
- **Surface**: `#2a2a3a`
- **Border**: `#3a3a4a`
- **Pure Black**: `#0a0a0a`

### Text Colors
- **Primary**: `#ffffff`
- **Secondary**: `#888888`
- **Muted**: `#666666`

## 📏 Development Rules & Constraints

0.  **Type Safety**:
    - ALWAYS use **TypeScript**. Never use `any` or `unknown`.
1.  **Package Manager**:
    - ALWAYS use **pnpm**. Never use `npm` or `yarn`.

2.  **UI Components**:
    - **Vuetify First**: Use Vuetify components (`v-btn`, `v-card`, etc.) whenever possible for consistent UI/UX.
    - **Tailwind**: Use Tailwind for layout, spacing, and specific color utilities (e.g., `text-pomodo-orange`).

3.  **Backend (Rust)**:
    - **Do NOT touch** `src-tauri` (Rust backend) unless explicitly instructed by the user.
    - Focus on the frontend (`src`) logic and UI.

4.  **Code Quality**:
    - **Reusable Components**: Extract common UI patterns into reusable components in `src/components`.
    - **File Size Limit**: Keep file line count **below 400 lines**. If a file exceeds this, propose a refactor to split it into smaller sub-components or composables.

5.  **Icons**:
    - **Lucide First**: Use `lucide-vue-next` for all icons.
    - Avoid `@mdi/js` unless strictly necessary for legacy reasons.

6.  **Workflow & Verification**:
    - **Linting**: Always ensure `pnpm lint` gives no warnings or errors.
    - **Biome Compliance**: STRICTLY follow the configuration and rules in `biome.json`.
    - **Formatting**: Always run `pnpm fmt` at the end of changes.
    - **Testing**: Always run `pnpm test` after changes to code.
    - **Test Integrity**: Never change tests unless explicitly instructed to.

## 📂 Project Structure

- `src/`: Frontend source code
    - `components/`: Reusable UI components
    - `pages/`: Main application screens/views
    - `stores/`: Pinia state stores
    - `plugins/`: Vue plugins (Vuetify, etc.)
- `src-tauri/`: Rust backend (Read-only unless instructed)

## 🏗 Architecture & Patterns

### Routing
- **Navigation**: Controlled by `AppLayout` events and state variables in `App.vue`.

### Persistence & Data
- **Rust Backend**: Data persistence is handled by the Rust backend.
- **Tauri Commands**: The frontend interacts with the database via Tauri's `invoke` command (e.g., `invoke("settings_get_all_settings")`).
- **DB Functions**: Wrapper functions for these invokes are located in `src/funcs/db/`.
- **State**: `Pinia` is used for client-side state management, often syncing with these backend calls.
