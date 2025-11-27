import { createApp } from "vue";
import "./style.css"; // Your Tailwind CSS imports
import App from "./App.vue";
import "vuetify/styles";
import { VueQueryPlugin } from "@tanstack/vue-query";
import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi-svg";

const vuetify = createVuetify({
	icons: {
		defaultSet: "mdi",
		aliases,
		sets: {
			mdi
		}
	},
	theme: {
		defaultTheme: "dark",
		themes: {
			light: {
				dark: false,
				colors: {
					primary: "#b8744f", // pomodo-orange
					secondary: "#c75450", // pomodo-red
					background: "#f5f5f5",
					surface: "#ffffff",
					"on-surface": "#1a1a1a"
				}
			},
			dark: {
				dark: true,
				colors: {
					primary: "#b8744f", // pomodo-orange
					secondary: "#c75450", // pomodo-red
					background: "#1a1a1a",
					surface: "#2a2a3a",
					"on-surface": "#ffffff"
				}
			}
		}
	}
});

// Create and mount the Vue app
const app = createApp(App);

// You can add global properties, plugins, etc. here
// For example, if you want to use Pinia for state management:
// import { createPinia } from 'pinia'
// app.use(createPinia())

// If you want to use Vue Router:
// import router from './router'
// app.use(router)

// Mount the app
app.use(VueQueryPlugin);

import { createPinia } from "pinia";

import router from "./router";

app.use(createPinia());
app.use(router);
app.use(vuetify).mount("#app");

// For Tauri, you might want to add:
// import { invoke } from '@tauri-apps/api/tauri'
//
// Window configuration for Tauri
// document.addEventListener('DOMContentLoaded', () => {
//   // Disable context menu in production
//   if (import.meta.env.PROD) {
//     document.addEventListener('contextmenu', e => e.preventDefault())
//   }
// })
