// uno.config.ts
import {
	defineConfig,
	presetAttributify,
	presetTypography,
	presetUno
} from 'unocss'
import presetWind from '@unocss/preset-wind'
import { presetForms } from '@julr/unocss-preset-forms'
import transformerVariantGroup from '@unocss/transformer-variant-group'
import transformerDirectives from '@unocss/transformer-directives'


export default defineConfig({
	presets: [
		presetTypography(),
		presetAttributify(), // required when using attributify mode
		presetUno({
			dark: 'class'
		}), // required
		presetWind(),
		presetForms(),
	],
	transformers: [
		transformerDirectives(),
		transformerVariantGroup(),
	],
	content: {
		pipeline: {
			include: [
				// the default
				/\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
				// include js/ts files
				'src/**/*.{js,ts,astro}',
			],
		},
		filesystem: [
			'public/pages/*.html'
		]
	},
	theme: {
		colors: {
			brand: {
				primary: '#02B9FF'
			}
		},
		container: {
			center: true,

			// Optional
			padding: {
				DEFAULT: '1rem',
				sm: '1.5rem',
				lg: '2rem'
			}
		},
	},
	shortcuts: {
		'border-interactable': 'border border-gray-200 dark:border-gray-700',
		'hoverable': 'hover:bg-gray-100 dark:(hover-bg-gray-600 text-white)',
		'bg-standout': 'bg-white dark:bg-gray-800'
	}
})
