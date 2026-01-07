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

// Mount the app
app.use(VueQueryPlugin);

import { createPinia } from "pinia";

import router from "./router";

app.use(createPinia());
app.use(router);
app.use(vuetify).mount("#app");
