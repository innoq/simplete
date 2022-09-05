/* eslint-env browser */
import { scrollIfNecessary, selectLast } from "./util";
import { dispatchEvent } from "uitil/dom/events";
import { find } from "uitil/dom";
import { nid } from "uitil/uid";
import bindMethods from "uitil/method_context";

export const TAG = "simplete-suggestions";
const DEFAULTS = {
	rootSelector: "simplete-form",
	itemSelector: "li",
	fieldSelector: "input[type=hidden]",
	resultSelector: "a"
};

const FOCUSSABLE_ELEMENTS = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1']";

export default class SimpleteSuggestions extends HTMLElement {
	constructor() {
		super();

		bindMethods(this, "onQuery", "onResults", "onCycle", "onConfirm", "onAbort");
	}

	connectedCallback() {
		this.setAttribute("role", "listbox");

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

		let status = this.querySelector("[data-autocomplete-status]");
		if(status) {
			dispatchEvent(
					this.root,
					"simplete-suggestion-status",
					{ status: status.getAttribute("data-autocomplete-status") || "" }
			);
		}

		find(this, FOCUSSABLE_ELEMENTS).
			forEach(el => el.setAttribute("tabindex", "-1"));

		find(this, this.itemSelector).forEach(el => {
			el.id = el.id || "simplete-suggestion" + nid();
			el.setAttribute("role", "option");
			el.setAttribute("aria-selected", "false");
		});
	}

	onCycle(ev) {
		let next = ev.detail.direction === "next";
		let selector = this.itemSelector;

		let currentItem = this.querySelector(`${selector}[aria-selected=true]`);
		if(!currentItem) { // select edge item, if any
			currentItem = next ? // eslint-disable-next-line indent
					this.querySelector(selector) : selectLast(this, selector);
		} else { // select adjacent item or wrap around
			currentItem.removeAttribute("aria-selected");

			let items = find(this, selector);
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
			scrollIfNecessary(currentItem);
		}
	}

	onConfirm(ev) {
		let item = this.querySelector(`${this.itemSelector}[aria-selected]`);
		let target = item.querySelector(this.fieldSelector) ||
				item.querySelector(this.resultSelector);
		if(target) {
			target.click(); // XXX: hacky?
		}
	}

	onAbort(ev) {
		this.render("");
	}

	onSelect(ev) {
		let item = ev.target.closest(this.itemSelector);
		if(!item) { // not a result
			return;
		}

		let field = this.selectItem(item);
		if(field) {
			ev.preventDefault();
		} else {
			ev.target.click(); // XXX: hacky?
		}
	}

	selectItem(node, preview) {
		if(!preview) {
			node = node.cloneNode(true); // prevents IE 11 from discarding child elements
			this.render("");
		}

		let payload = {
			id: node.id,
			preview
		};
		let field = node.querySelector(this.fieldSelector);
		if(field) {
			let { name, value } = field;
			Object.assign(payload, { name, value });
		} else if(node && node.textContent) {
			Object.assign(payload, { value: node.textContent.trim() });
		}

		dispatchEvent(this.root, "simplete-suggestion-selection", payload);
		return !!field;
	}

	render(suggestions, pending) {
		if(pending) {
			this.setAttribute("aria-busy", "true");
		} else {
			this.removeAttribute("aria-busy");
		}

		if(suggestions || suggestions === "") {
			this.innerHTML = suggestions;

			dispatchEvent(this.root, "simplete-suggestion-toggle", {
				expanded: this.innerHTML.trim() !== ""
			});
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
		let selector = this.getAttribute("root-selector") || DEFAULTS.rootSelector;
		return this.closest(selector);
	}
}
