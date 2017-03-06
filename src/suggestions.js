/* eslint-env browser */
import { dispatchEvent } from "uitil/dom/events";

export default class SimpleteSuggestions extends HTMLElement {
	constructor(self) { // NB: `self` only required due to polyfill
		self = super(self);

		this.onQuery = this.onQuery.bind(this);
		this.onResults = this.onResults.bind(this);

		return self;
	}

	connectedCallback() {
		this.setAttribute("aria-live", "polite");

		this.addEventListener("click", this.onSelect);
		this.nonLocalHandlers("+");
	}

	disconnectedCallback() {
		this.nonLocalHandlers("-");
	}

	onQuery(ev) {
		let { detail } = ev;
		if(detail && detail.reset) {
			this.render("");
		} else {
			this.render(null, true);
		}
	}

	onResults(ev) { // TODO: rename
		this.render(ev.detail.html);
	}

	onSelect(ev) {
		// TODO: enfore `<a …>` for accessibility?
		let field = ev.target.querySelector("input[type=hidden]");
		if(!field) {
			return; // let the browser's default behavior kick in
		}

		this.render("");
		let { name, value } = field;
		dispatchEvent(this.root, "simplete-selection", { name, value });
		ev.preventDefault();
	}

	render(suggestions, pending) {
		if(pending) {
			this.setAttribute("aria-busy", "true");
		} else {
			this.removeAttribute("aria-busy");
		}

		if(suggestions || suggestions === "") {
			this.innerHTML = suggestions;
		} // NB: intentionally not erasing suggestions otherwise to avoid flickering
	}

	nonLocalHandlers(op) {
		op = {
			"+": "addEventListener",
			"-": "removeEventListener"
		}[op];
		let { root } = this;
		root[op]("simplete-query", this.onQuery);
		root[op]("simplete-response", this.onResults);
	}

	get root() {
		return this.closest("simplete-form");
	}
};

customElements.define("simplete-suggestions", SimpleteSuggestions);
