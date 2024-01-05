import maxiframeData from './data.json'

export default () => ({
	search: '',
	showResults: false,
	darkMode: Alpine.$persist(false),
	fuseInstance: null,
	noResults: false,
	data: maxiframeData,
	selectedFrameIndex: -1,
	selectedAbilityIndex: -1,
	abilityModifiers: {
		duration: {
			value: 100,
			type: "percentage",
			name: "Ability Duration",
		},
		efficiency: {
			value: 100,
			type: "percentage",
			name: "Ability Efficiency",
		},
		range: {
			value: 100,
			type: "percentage",
			name: "Ability Range",
		},
		strength: {
			value: 100,
			type: "percentage",
			name: "Ability Strength",
		}
	},
	init() {
		this.toggleDarkMode(true)
		const fuseOptions = {
			//isCaseSensitive: false,
			//includeScore: false,
			//shouldSort: true,
			// This includes the abilities when they're matched
			includeMatches: true,
			// findAllMatches: false,
			// minMatchCharLength: 1,
			// location: 0,
			// This value prevents matching Teleport when searching Zephyr.
			// No idea how it arrived at that conclusion
			threshold: 0.5,
			// distance: 20,
			// useExtendedSearch: false,
			// ignoreLocation: false,
			// ignoreFieldNorm: false,
			// fieldNormWeight: 1,
			keys: [
				"name",
				"abilities.id"
			]
		};
		this.fuseInstance = new Fuse(this.data, fuseOptions)
		// this will recalculate stats once when the component is loaded
		// then again whenever a modifier is changed in the component
		Alpine.effect(() => {
			// logically only recalculate stats when we have a frame selected
			if (this.selectedFrameIndex != -1) {
				const context = this.getContext(this.selectedFrameIndex)
				if (this.selectedAbilityIndex != -1) {
					// if we have an ability selected only calculate its stats
					let ability = this.data[this.selectedFrameIndex].abilities[this.selectedAbilityIndex]
					ability.stats = this.getAbilityStats(ability, context)
				} else {
					this.data[this.selectedFrameIndex].abilities.stats = this.data[this.selectedFrameIndex].abilities.map((ability) => this.getAbilityStats(ability, context))
				}
			}
		})

	},
	toggle(what) {
		this[what] = !this[what]
	},
	toggleDarkMode(init = false) {
		if (!init) this.toggle('darkMode')
		document.querySelector('html').classList.toggle('dark', this.darkMode)
	},

	getAbilityLink(ability, index) {
		let link = '/' + this.data[this.selectedFrameIndex].name
		if (this.selectedAbilityIndex == index)
			return link
		else return link + '/' + ability.id
	},

	//#region route handlers

	// Get the indicies of the currently selected frame and ability if any
	// This is a handler for the "/:warframe/:ability?" route
	getIndicies(ctx) {
		this.showResults = false
		this.selectedFrameIndex = this.data.findIndex((warframe) => ctx.params.warframe.toLowerCase() == warframe.name.toLowerCase())
		if (this.selectedFrameIndex == -1) {
			return
		}
		if (ctx.params.ability) {
			this.selectedAbilityIndex = this.data[this.selectedFrameIndex].abilities.findIndex((ability) => ctx.params.ability.toLowerCase() == ability.id)
		} else {
			this.selectedAbilityIndex = -1
		}

	},
	//#endregion

	//#region search results

	searchResults() {
		if (this.isSearchEmpty())
			return []
		let results = this.fuseInstance.search(this.search)
		if (results.length < 1) this.noResults = true
		else this.noResults = false
		return results
	},
	isSearchEmpty() {
		return this.search.toLowerCase().replace(' ', '').trim() == ''
	},
	getAbilityNameFromSearchResult(result) {
		return this.data[result.refIndex].abilities[result.matches[0].refIndex].name
	},
	getAbilityIdFromSearchResult(result) {
		return this.data[result.refIndex].abilities[result.matches[0].refIndex].id
	},

	//#endregion

	//#region maximization page

	getAbilityModifiers() {
		return { ...this.abilityModifiers, ...(this.data[this.selectedFrameIndex].extraModifiers ?? []) }
	},

	// where the actual calculations happen.
	// it takes a frame index & ability index, and calculate all the stats
	getAbilityStats(ability, context) {
		if (!ability.stats.length) return []

		// evaluate a formula in context
		function evalInContext(scr, context) {
			return (new Function("with(this) { return " + scr + "}")).call(context);
		}

		let stats = ability.stats.map((stat) => {
			context['BASE'] = stat.base
			let newStat = stat
			try {
				newStat.value = evalInContext(newStat.formula, context).toFixed(newStat.digitsAfterDecimalPoint)
			} catch (err) {
				console.error('evalErr: ', err)
			}

			return newStat
		})

		return stats
	},

	getAbilities(selected = false) {
		if (selected && this.selectedAbilityIndex != -1) {
			return [this.data[this.selectedFrameIndex].abilities[this.selectedAbilityIndex]]
		}
		return this.data[this.selectedFrameIndex].abilities
	},

	getContext(frameIndex) {
		let context = {
			DUR: this.abilityModifiers.duration.value / 100,
			EFF: Math.max(2 - (this.abilityModifiers.efficiency.value / 100), 0.25),
			RNG: this.abilityModifiers.range.value / 100,
			STR: this.abilityModifiers.strength.value / 100,
		}

		// add frame-specific extra modifiers
		for (const key in this.data[frameIndex].extraModifiers) {
			let modifier = this.data[frameIndex].extraModifiers[key]
			context[key] = modifier.type == 'percentage' ? modifier.value / 100 : modifier.value
		}
		return context
	},

	isStatPositive(stat) {
		let biggerThanBase = stat.value > stat.base

		return stat.biggerIsPositive ? biggerThanBase : !biggerThanBase

	},

	getStatColor(stat) {
		if (stat.base == stat.value) return ''
		return this.isStatPositive(stat) ? 'positive' : 'negative'
	}

	//#endregion
})
