/* eslint-env browser */
import { selectLast } from "./util";
import { dispatchEvent } from "uitil/dom/events";

const TAG = "simplete-suggestions";
const DEFAULTS = {
	itemSelector: "li" // TODO: document dynamic configuration
};

export default class SimpleteSuggestions extends HTMLElement {
	constructor(self) { // NB: `self` only required due to polyfill
		self = super(self);

		this.onQuery = this.onQuery.bind(this);
		this.onResults = this.onResults.bind(this);
		self.onCycle = self.onCycle.bind(self);

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

		// determine item selector
		let attr = "data-item-selector";
		// NB: parent node is used to work around `querySelector` limitation WRT
		//     immediate child elements -- XXX: not actually necessary?
		let container = this.parentNode.querySelector(`${TAG} > [${attr}]`);
		let selector = container && container.getAttribute(attr);
		this.itemSelector = selector || DEFAULTS.itemSelector;
	}

	onCycle(ev) {
		let next = ev.detail.direction === "next";
		let selector = this.itemSelector;

		let currentItem = this.querySelector(`${selector}[aria-selected]`);
		if(!currentItem) { // select edge item, if any
			currentItem = next ? this.querySelector(selector) :
					selectLast(this, selector);
		} else { // select adjacent item or wrap around
			currentItem.removeAttribute("aria-selected");

			let items = [...this.querySelectorAll(selector)];
			let index = items.indexOf(currentItem);
			if(next) {
				currentItem = items[index + 1] || items[0];
			} else {
				currentItem = index > 0 ? items[index - 1] : items[items.length - 1];
			}
		}

		if(currentItem) {
			currentItem.setAttribute("aria-selected", "true");
			this.selectItem(currentItem, true);
		}
	}

	onSelect(ev) {
		this.selectItem(ev.target);
		ev.preventDefault();
	}

	selectItem(node, preview) {
		// TODO: enfore `<a …>` for accessibility?
		let field = node.querySelector("input[type=hidden]");
		if(!field) {
			return; // let the browser's default behavior kick in
		}

		if(!preview) {
			this.render("");
		}
		let { name, value } = field;
		dispatchEvent(this.root, "simplete-selection", { name, value, preview });
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
		root[op]("simplete-nav", this.onCycle);
	}

	get root() {
		return this.closest("simplete-form");
	}
};

customElements.define(TAG, SimpleteSuggestions);
