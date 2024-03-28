import '@unocss/reset/tailwind.css'

import 'virtual:uno.css'

/// Import Alpine.js
import Alpine from 'alpinejs'
/// Import Alpine.js plugins
import persist from '@alpinejs/persist'
import PineconeRouter from 'pinecone-router'

import maxiframe from "./maxiframe.js"


import Fuse from 'fuse.js'
window.Fuse = Fuse

/// load plugins
Alpine.plugin(PineconeRouter)
Alpine.plugin(persist)
Alpine.data('maxiframe', maxiframe)
window.Alpine = Alpine
Alpine.start()


// allow focus outline when tabbing
document.body.addEventListener(
	'keyup',
	(e) =>
		e.key === 'Tab' &&
		document.documentElement.classList.remove(
			'no-focus-outline'
		)
)

