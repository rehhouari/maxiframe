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
	oldSelectedFrameIndex: -1,
	oldSelectedFrameIndex: -1,
	// modifiers that were changed before switching to another frame
	changedModifiers: [],
	// default modifiers shared by all frames
	baseAbilityModifiers: {
		DUR: {
			value: 100,
			type: "percentage",
			name: "Ability Duration",
		},
		EFF: {
			value: 100,
			type: "percentage",
			name: "Ability Efficiency",
		},
		RNG: {
			value: 100,
			type: "percentage",
			name: "Ability Range",
		},
		STR: {
			value: 100,
			type: "percentage",
			name: "Ability Strength",
		}
	},

	// all ability modifiers used by currently selected frame
	// includes base ability modifiers
	abilityModifiers: {},

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
		// create a fuse fuzzy search instance
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
	getIndicies(ctx) {
		console.time('handlers')
		this.showResults = false
		this.oldSelectedFrameIndex = this.selectedFrameIndex
		this.oldSelectedAbilityIndex = this.selectedAbilityIndex

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

	getAbilityModifiers() {
		// when a new frame is selected, combine the base and extra modifiers into one object
		// or when a frame is selected for the first time)
		if (this.oldSelectedFrameIndex == -1 || (this.oldSelectedFrameIndex != this.selectedFrameIndex)) {
			this.abilityModifiers = { ...this.baseAbilityModifiers, ...(this.data[this.selectedFrameIndex].extraModifiers ?? []) }
		}
	},

	// this will decide when to recalculate stats based on current and previously selected frame and which modifiers were changed
	calculateStatsAccordingly() {
		if (this.changedModifiers.length) {
			this.calculateStats(this.changedModifiers)
		}
		// reset the values
		this.changedModifiers = []
		console.timeEnd('handlers')
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

	changeModifier(key, value = null) {
		console.log({ key, value })
		if (value != null) {
			this.abilityModifiers[key].value = value
		}
		if (!this.changedModifiers.includes(key)) {
			this.changedModifiers.push(key)
		}
		// recalculate stats of current ability or all current frame abilities everytime a modifier is changed
		this.calculateStats([key])
	},

	// calculate all stats for current ability, or all abilities of current frame
	calculateStats(modifiers = []) {
		console.log({ 'cstats': modifiers })
		const context = this.getContext(this.selectedFrameIndex)
		if (this.selectedAbilityIndex != -1) {
			// if we have an ability selected only calculate its stats
			let ability = this.data[this.selectedFrameIndex].abilities[this.selectedAbilityIndex]
			ability.stats = this.getAbilityStats(ability, context, modifiers)
		} else {
			this.data[this.selectedFrameIndex].abilities.stats = this.data[this.selectedFrameIndex].abilities.map((ability) => this.getAbilityStats(ability, context, modifiers))
		}
	},


	// where the actual calculations happen.
	// it takes a frame index & ability index, and calculate all the stats
	// it also take modifiers for when it is changed, and recalculate all stats that uses it
	// when no modifiers are present it recalculate all stats
	getAbilityStats(ability, context, modifiers = []) {
		if (!ability.stats.length) return []

		// evaluate a formula in context
		function evalInContext(scr, context) {
			return (new Function("with(this) { return " + scr + "}")).call(context);
		}

		let stats = ability.stats.map((stat) => {
			context['BASE'] = structuredClone(stat.base)
			// only calculated stats that use affected modifier
			if (modifiers.length && modifiers.some(modifier => stat.formula.includes(modifier)) == false) {
				return stat
			}
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

	getAbilityLink(ability, index) {
		let link = '/' + this.data[this.selectedFrameIndex].name
		if (this.selectedAbilityIndex == index)
			return link
		else return link + '/' + ability.id
	},

	getAbilities(selected = false) {
		if (selected && this.selectedAbilityIndex != -1) {
			return [this.data[this.selectedFrameIndex].abilities[this.selectedAbilityIndex]]
		}
		return this.data[this.selectedFrameIndex].abilities
	},

	getContext() {
		let context = {}
		for (let key in this.abilityModifiers) {
			let modifier = this.abilityModifiers[key]
			// for the EFF (efficiency) modifier, use a custom formula
			if (key == 'EFF') context[key] = Math.max(2 - modifier.value / 100, 0.25)
			else context[key] = modifier.type == 'percentage' ? modifier.value / 100 : modifier.value
		}

		return context
	},

	isStatPositive(stat) {
		let biggerThanBase = stat.value > stat.base

		return stat.biggerIsPositive ? biggerThanBase : !biggerThanBase

	},

	getStatValue(stat) {
		// if there is no value, meaning it wasn't calculated since modifier didn't change
		// then use the base value
		return stat.prefix + (stat.value || stat.base.toFixed(stat.digitsAfterDecimalPoint)) + stat.unit
	},

	getStatColor(stat) {
		// if there is no value, consider it base meaning default
		if (!stat.value || stat.base == stat.value) return ''
		return this.isStatPositive(stat) ? 'positive' : 'negative'
	},


	getWikiLink(name) {
		function capitalizeName(name) {
			let i, frags = name.split('_');
			for (i = 0; i < frags.length; i++) {
				frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
			}
			return frags.join('_');
		}
		return 'https://warframe.fandom.com/wiki/' + capitalizeName(name)

		//#endregion
	},
	showSearch() {
		this.$refs['searchInput'].focus()
		this.showResults = true
	},
	hideSearch() {
		this.showResults = false
		this.$refs['searchInput'].blur()
	}
})
