/* eslint-env browser */
import { selectLast } from "./util";
import { dispatchEvent, dispatchDOMEvent } from "uitil/dom/events";
import bindMethods from "uitil/method_context";

const TAG = "simplete-suggestions";
const DEFAULTS = {
	itemSelector: "li",
	fieldSelector: "input[type=hidden]",
	resultSelector: "a"
};

export default class SimpleteSuggestions extends HTMLElement {
	// NB: `self` only required due to document-register-element polyfill
	constructor(self) {
		self = super(self);

		bindMethods(self, "onQuery", "onResults", "onCycle", "onConfirm", "onAbort");

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

		// determine and cache selectors
		let attribs = {
			itemSelector: "data-item-selector",
			fieldSelector: "data-field-selector",
			resultSelector: "data-result-selector"
		};
		Object.keys(attribs).forEach(prop => {
			let attr = attribs[prop];
			// NB: parent node is used to work around `querySelector` limitation
			//     WRT immediate child elements -- XXX: not actually necessary?
			let container = this.parentNode.querySelector(`${TAG} > [${attr}]`);
			let selector = container && container.getAttribute(attr);
			this[prop] = selector || DEFAULTS[prop];
		});
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

	onConfirm(ev) {
		let selector = `${this.itemSelector}[aria-selected] ${this.resultSelector}`.
			trim(); // just to be safe
		let currentItem = this.querySelector(selector);
		if(currentItem) {
			// FIXME: this doesn't work for results (as opposed to suggestions) as
			//        there we'd have to click on the link (or whatever) _within_
			dispatchDOMEvent(currentItem, "click"); // XXX: hacky?
		}
	}

	onAbort(ev) {
		this.render("");
	}

	onSelect(ev) {
		this.selectItem(ev.target);
		ev.preventDefault();
	}

	selectItem(node, preview) {
		let field = node.querySelector(this.fieldSelector);
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
		root[op]("simplete-confirm", this.onConfirm);
		root[op]("simplete-abort", this.onAbort);
	}

	get root() {
		return this.closest("simplete-form");
	}
};

customElements.define(TAG, SimpleteSuggestions);
