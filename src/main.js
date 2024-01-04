import '@unocss/reset/tailwind.css'

import 'virtual:uno.css'

/// Import Alpine.js
import Alpine from 'alpinejs'
/// Import Alpine.js plugins
import focus from '@alpinejs/focus'
import persist from '@alpinejs/persist'
import Clipboard from "@ryangjchandler/alpine-clipboard"
import PineconeRouter from 'pinecone-router'

import maxiframe from "./maxiframe.js"

import Fuse from 'fuse.js'
window.Fuse = Fuse

/// load plugins
Alpine.plugin(PineconeRouter)
Alpine.plugin(focus)
Alpine.plugin(persist)
Alpine.plugin(Clipboard)
Alpine.data('maxiframe', maxiframe)
window.Alpine = Alpine
Alpine.start()