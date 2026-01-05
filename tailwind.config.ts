import { frostedThemePlugin } from "@whop/react/tailwind";
import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: "#FF7A1A",
					50: "#FFF4ED",
					100: "#FFE8D6",
					200: "#FFD1AD",
					300: "#FFB26B",
					400: "#FF7A1A",
					500: "#FF7A1A",
					600: "#E66A00",
					700: "#CC5A00",
					800: "#B34A00",
					900: "#993A00",
				},
				background: "#FAFAFA",
				surface: "#FFFFFF",
				border: "#EDEDED",
				text: {
					primary: "#1F2937",
					muted: "#6B7280",
				},
			},
			borderRadius: {
				DEFAULT: "12px",
				lg: "12px",
			},
			boxShadow: {
				subtle: "0 8px 24px rgba(0,0,0,0.04)",
			},
			transitionDuration: {
				DEFAULT: "150ms",
				fast: "150ms",
				normal: "200ms",
			},
			transitionTimingFunction: {
				DEFAULT: "ease",
			},
		},
	},
	plugins: [frostedThemePlugin()],
};

export default config;
