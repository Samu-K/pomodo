# Pomodo App - Complete File Structure

## 📁 Project Structure

```
pomodo-app/
├── src/
│   ├── components/
│   │   ├── AppLayout.vue           # Main layout wrapper with navigation
│   │   ├── TimerScreen.vue         # Pomodoro timer interface
│   │   ├── StatsScreen.vue         # Statistics and analytics view
│   │   ├── SettingsScreen.vue      # App settings and preferences
│   │   ├── TimelineScreen.vue      # Timeline/schedule view
│   │   ├── CreateTaskModal.vue     # Modal for creating tasks
│   │   └── CreateCategoryModal.vue # Modal for creating categories
│   │
│   ├── App.vue                     # Root component
│   ├── main.ts                     # App entry point
│   └── style.css                   # Global styles with Tailwind
│
├── src-tauri/                      # Tauri backend
│   ├── src/
│   │   └── main.rs
│   ├── Cargo.toml
│   ├── build.rs
│   └── tauri.conf.json
│
├── public/
│   └── (assets if any)
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js              # Your Tailwind configuration
└── README.md
```

## 🚀 Setup Instructions

### 1. Initialize the Project

```bash
# Create new Tauri + Vue project
npm create tauri-app@latest pomodo-app -- --template vue-ts

# Navigate to project
cd pomodo-app
```

### 2. Install Dependencies

```bash
# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install UI dependencies
npm install lucide-vue-next

# Install Vue TSX support (if not already included)
npm install -D @vitejs/plugin-vue-jsx
```

### 3. Configure Vite

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx() // Enable JSX/TSX in .vue files
  ],
  // Prevent Vite from obscuring Tauri errors
  clearScreen: false,
  // Tauri expects a fixed port
  server: {
    port: 1420,
    strictPort: true,
  }
})
```

### 4. Configure TypeScript

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "jsx": "preserve",

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases (optional) */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 5. Add Tailwind Configuration

Replace `tailwind.config.js` with the provided configuration that includes your custom Pomodo theme.

### 6. Update HTML Template

Update `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pomodo - Pomodoro Timer</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### 7. Configure Tauri

Update `src-tauri/tauri.conf.json`:

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:1420",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Pomodo",
    "version": "1.0.0"
  },
  "tauri": {
    "windows": [
      {
        "title": "Pomodo",
        "width": 400,
        "height": 700,
        "resizable": true,
        "minWidth": 350,
        "minHeight": 600,
        "decorations": false,
        "transparent": true,
        "center": true
      }
    ],
    "security": {
      "csp": null
    },
    "bundle": {
      "active": true,
      "identifier": "com.yourcompany.pomodo",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    }
  }
}
```

## 📝 Component Import Map

Here's how components are connected:

```typescript
// App.vue imports:
import AppLayout from './components/AppLayout.vue'
import TimerScreen from './components/TimerScreen.vue'
import StatsScreen from './components/StatsScreen.vue'
import SettingsScreen from './components/SettingsScreen.vue'
import TimelineScreen from './components/TimelineScreen.vue'
import CreateTaskModal from './components/CreateTaskModal.vue'
import CreateCategoryModal from './components/CreateCategoryModal.vue'

// All screen components use:
import { /* icons */ } from 'lucide-vue-next'
```

## 🎨 Styling Classes Used

All components use Tailwind utility classes with custom theme colors:
- `bg-dark-bg` - Main background
- `bg-dark-surface` - Card/surface background
- `border-dark-border` - Border color
- `text-pomodo-orange` - Primary orange
- `text-pomodo-red` - Secondary red
- `text-pomodo-gold` - Tertiary gold
- `from-pomodo-orange to-pomodo-red` - Gradients

## 🏃 Running the App

```bash
# Development
npm run tauri dev

# Build for production
npm run tauri build
```

## 📦 Build Output

After building, you'll find:
- **Windows**: `.msi` and `.exe` installer in `src-tauri/target/release/bundle/`
- **macOS**: `.app` and `.dmg` in `src-tauri/target/release/bundle/`
- **Linux**: `.deb` and `.AppImage` in `src-tauri/target/release/bundle/`

## 🔧 Next Steps for Functionality

1. **State Management**: Add Pinia or Vuex for global state
2. **Timer Logic**: Implement countdown timer with Web Workers
3. **Data Persistence**: Use Tauri's filesystem API or SQLite
4. **Notifications**: Implement system notifications via Tauri
5. **Sound Effects**: Add completion sounds
6. **Keyboard Shortcuts**: Add global shortcuts via Tauri

That's it! All the design files are ready to use. Just copy them into your project structure and start building the functionality! 🚀
