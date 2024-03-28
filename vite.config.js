import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
	plugins: [
		UnoCSS({
			injectReset: true,
		}),
		VitePWA({
			registerType: 'autoUpdate',
			workbox: {
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/rsms\.me\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'inter-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					{
						urlPattern: /^https:\/\/static\.wikia\.nocookie\.net\/\/warframe\/images\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'wikia-images-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
				],
			}
		})
	],
})
