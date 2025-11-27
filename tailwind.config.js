import { tailwindColors } from "./src/defines/theme.config";

/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
	darkMode: "class",
	theme: {
		extend: {
			colors: tailwindColors,
			fontFamily: {
				sans: [
					"-apple-system",
					"BlinkMacSystemFont",
					"Segoe UI",
					"Roboto",
					"Oxygen",
					"Ubuntu",
					"sans-serif",
				],
			},
			animation: {
				progress: "progress 1s ease-in-out",
				"slide-up": "slideUp 0.3s ease-out",
				"slide-down": "slideDown 0.3s ease-out",
				"fade-in": "fadeIn 0.2s ease-out",
				"scale-in": "scaleIn 0.2s ease-out",
			},
			keyframes: {
				progress: {
					"0%": { strokeDashoffset: "565.48" },
					"100%": { strokeDashoffset: "0" },
				},
				slideUp: {
					"0%": { transform: "translateY(100%)", opacity: "0" },
					"100%": { transform: "translateY(0)", opacity: "1" },
				},
				slideDown: {
					"0%": { transform: "translateY(-100%)", opacity: "0" },
					"100%": { transform: "translateY(0)", opacity: "1" },
				},
				fadeIn: {
					"0%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
				scaleIn: {
					"0%": { transform: "scale(0.9)", opacity: "0" },
					"100%": { transform: "scale(1)", opacity: "1" },
				},
			},
			borderRadius: {
				xl: "12px",
				"2xl": "20px",
				"3xl": "30px",
			},
			spacing: {
				18: "4.5rem",
				88: "22rem",
			},
			fontSize: {
				timer: [
					"72px",
					{ lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "700" },
				],
			},
			boxShadow: {
				modal: "0 20px 60px rgba(0,0,0,0.5)",
				fab: "0 4px 12px rgba(183, 116, 79, 0.4)",
				"fab-hover": "0 6px 20px rgba(183, 116, 79, 0.6)",
			},
		},
	},
	plugins: [],
};
