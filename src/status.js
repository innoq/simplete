/* eslint-env browser */
import bindMethods from "uitil/method_context";

export const TAG = "simplete-status";
const DEFAULTS = {
	rootSelector: "simplete-form"
};

export default class SimpleteStatus extends HTMLElement {
	constructor() {
		super();

		bindMethods(this, "onSuggestionStatus");
	}

	connectedCallback() {
		this.setAttribute("aria-live", "assertive");

		this.root.addEventListener("simplete-suggestion-status", this.onSuggestionStatus);
	}

	onSuggestionStatus(ev) {
		this.textContent = ev.detail.status;
	}

	get root() {
		let selector = this.getAttribute("root-selector") || DEFAULTS.rootSelector;
		return this.closest(selector);
	}
}
