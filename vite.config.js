import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
	plugins: [
		UnoCSS({
			injectReset: true
		}),
		VitePWA()
	],
})