import maxiframeData from './data.json'

export default () => ({
	search: '',
	showResults: false,
	darkMode: Alpine.$persist(false),
	fuseInstance: null,
	noResults: false,
	data: maxiframeData,
	selectedFrameIndex: null,
	selectedAbilityIndex: null,
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
	loading: true,
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
				"warframeName",
				"abilities.id"
			]
		};
		this.fuseInstance = new Fuse(this.data, fuseOptions)

	},
	toggle(what) {
		this[what] = !this[what]
	},
	toggleDarkMode(init = false) {
		if (!init) this.toggle('darkMode')
		document.querySelector('html').classList.toggle('dark', this.darkMode)
	},

	//#region route handlers

	// Get the indicies of the currently selected frame and ability if any
	// This is a handler for the "/:warframe/:ability?" route
	async getIndicies(ctx) {
		this.selectedFrameIndex = this.data.findIndex((value) => ctx.params.warframe.toLowerCase() == value.warframeName.toLowerCase())
		if (this.selectedFrameIndex != -1 && ctx.params.ability) {
			this.selectedAbilityIndex = this.data[this.selectedFrameIndex].abilities.findIndex((value) => ctx.params.ability.toLowerCase() == value.id)
		} else {
			this.selectedAbilityIndex = -1
		}
		this.showResults = false
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

	getAbilities() {
		return this.data[this.selectedFrameIndex].abilities
	},

	getAbilityModifiers() {
		return { ...this.abilityModifiers, ...(this.data[this.selectedFrameIndex].extraModifiers ?? []) }
	},

	// where the actual calculations happen.
	// takes an ability index, instead of the ability object made available by the loop
	// this is due to a ReferenceError occuring when switching between pages, to try for your self remove the first line
	// then rename abilityIndex argument to ability and pass ability instead of abilityIndex in maximization.html
	// the reason the errors happen is when clicking the link of another warframe from the search, the calculator refreshes
	// before moving to the next page, and calls this method with the`ability` object of the previous warframe.
	// however this would use the context of the new warframe that was just selected (selectedFrameIndex)
	// even if we pass the selectedFrameIndex with the ability object, it would be reactive(?) and thus would refer to the new
	// warframe just selected, thus running the previous warframe's formula with the current frame context, causing
	// a `ReferenceError`
	getAbilityStats(abilityIndex) {
		let ability = this.data[this.selectedFrameIndex].abilities[abilityIndex]

		if (!ability.stats.length) return []

		let context = {
			DUR: this.abilityModifiers.duration.value / 100,
			EFF: Math.max(2 - (this.abilityModifiers.efficiency.value / 100), 0.25),
			RNG: this.abilityModifiers.range.value / 100,
			STR: this.abilityModifiers.strength.value / 100,
		}

		// add frame-specific extra modifiers
		for (const key in this.data[this.selectedFrameIndex].extraModifiers) {
			context[key] = this.data[this.selectedFrameIndex].extraModifiers[key].value
		}

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
