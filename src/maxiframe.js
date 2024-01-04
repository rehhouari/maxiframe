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
		duration: 100,
		efficiency: 100,
		range: 100,
		strength: 100
	},
	init() {
		this.toggleDarkMode(true)
		const fuseOptions = {
			//isCaseSensitive: false,
			//includeScore: false,
			// shouldSort: true,
			includeMatches: true,
			// findAllMatches: false,
			// minMatchCharLength: 1,
			// location: 0,
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
		if (this.loading) return
		this[what] = !this[what]
	},
	toggleDarkMode(init = false) {
		if (!init) this.toggle('darkMode')
		document.querySelector('html').classList.toggle('dark', this.darkMode)
	},
	searchResults() {
		if (this.isSearchEmpty())
			return []
		let results = this.fuseInstance.search(this.search)
		if (results.length < 1) this.noResults = true
		else this.noResults = false
		console.log("results: ", results)
		return results
	},
	isSearchEmpty() {
		return this.search.toLowerCase().replace(' ', '').trim() == ''
	},
	getAbilityName(result) {
		return this.data[result.refIndex].abilities[result.matches[0].refIndex].name
	},
	getAbilityId(result) {
		return this.data[result.refIndex].abilities[result.matches[0].refIndex].id
	},
	getAbilities(selected = false) {
		if (selected && this.selectedAbilityIndex != -1) {
			return [this.data[this.selectedFrameIndex].abilities[this.selectedAbilityIndex]]
		}
		return this.data[this.selectedFrameIndex].abilities
	},
	getIndicies(ctx) {
		this.selectedFrameIndex = maxiframeData.findIndex((value) => ctx.params.warframe.toLowerCase() == value.warframeName.toLowerCase())
		if (this.selectedFrameIndex != -1) {
			this.selectedAbilityIndex = maxiframeData[this.selectedFrameIndex].abilities.findIndex((value) => ctx.params.ability.toLowerCase() == value.id)
		}
	}

})
