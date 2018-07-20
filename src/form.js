/* eslint-env browser */
import { TAG as SUGGESTIONS_TAG } from "./suggestions";
import { serializeForm } from "uitil/dom/forms";
import { dispatchEvent } from "uitil/dom/events";
import bindMethods from "uitil/method_context";
import debounce from "uitil/debounce";

export const TAG = "simplete-form";
const DEFAULTS = {
	searchFieldSelector: "input[type=search]",
	queryDelay: 200 // milliseconds
};

const RESET = {}; // poor man's `Symbol`

export default class SimpleteForm extends HTMLElement {
	// NB: `self` only required due to document-register-element polyfill
	constructor(self) {
		self = super(self);

		bindMethods(self, "onInput", "onResponse");

		return self;
	}

	connectedCallback() {
		if(!this.querySelector(SUGGESTIONS_TAG)) { // guard against repeat initialization
			let results = document.createElement(SUGGESTIONS_TAG);
			this.appendChild(results);
		}

		let field = this.searchField;
		field.setAttribute("autocomplete", "off");

		let onQuery = debounce(this.queryDelay, this, this.onQuery);
		this.addEventListener("input", onQuery);
		this.addEventListener("change", onQuery);
		this.addEventListener("simplete-suggestion-selection", this.onSelect);
		field.addEventListener("keydown", this.onInput);
	}

	onQuery(ev) {
		this.query = this.searchField.value;

		let res = this.submit();
		if(res === RESET) {
			dispatchEvent(this, "simplete-query", { reset: true });
		} else if(res) {
			this.setAttribute("aria-busy", "true");

			res.then(this.onResponse).
				// eslint-disable-next-line handle-callback-err
				catch(err => void this.onResponse(null));

			dispatchEvent(this, "simplete-query");
		}

		ev.stopPropagation();
	}

	onResponse(html) {
		this.removeAttribute("aria-busy");
		dispatchEvent(this, "simplete-response", { html }); // TODO: rename event and payload?
	}

	onInput(ev) {
		// ignore potential keyboard shortcuts
		if(ev.ctrlKey || ev.altKey || ev.metaKey) {
			return;
		}

		switch(ev.code || ev.key || ev.keyCode) {
		case "ArrowUp":
		case "Numpad8":
		case 38: // arrow up
			dispatchEvent(this, "simplete-nav", { direction: "prev" });
			break;
		case "ArrowDown":
		case "Numpad2":
		case 40: // arrow down
			dispatchEvent(this, "simplete-nav", { direction: "next" });
			break;
		case "Enter":
		case 13: // Enter
			// suppress form submission (only) while navigating results -
			// otherwise let the browser's default behavior kick in
			if(this.navigating) {
				delete this.navigating;
				dispatchEvent(this, "simplete-confirm"); // TODO: rename?
				ev.preventDefault();
			}
			break;
		case "Escape":
		case 27: // Escape
			if(this.query) { // restore original (pre-preview) input
				this.searchField.value = this.query;
				delete this.navigating;
				dispatchEvent(this, "simplete-abort"); // TODO: rename?
				ev.preventDefault();
			}
			break;
		}
	}

	onSelect(ev) {
		let { value, preview } = ev.detail;
		if(preview) {
			this.navigating = true;
		}
		if(value) {
			this.searchField.value = value;
			this.payload = this.serialize();
		}

		// notify external observers
		if(value && !preview) {
			dispatchEvent(this, "simplete-selection", { value }, { bubbles: true });
		}
	}

	submit() {
		// guard against blank search terms
		// NB: if someone wanted to provide generic recommendations instead of
		//     aborting, they could override `#blank`
		if(this.blank) {
			delete this.payload;
			return RESET;
		}
		// guard against redundant requests
		let payload = this.serialize();
		if(payload === this.payload) {
			return;
		}
		this.payload = payload;

		let { uri, method } = this.formParams;
		let headers = { Accept: "text/html; fragment=true" };
		// TODO: strip existing query string from URI, if any? should be invalid
		if(method === "GET") {
			return this.httpRequest(method, `${uri}?${payload}`, headers);
		} else {
			headers["Content-Type"] = "application/x-www-form-urlencoded";
			return this.httpRequest(method, uri, headers, payload);
		}
	}

	serialize() {
		// generate temporary form
		let form = document.createElement("form");
		[...this.children].forEach(node => {
			let clone = node.cloneNode(true);
			form.appendChild(clone);
		});
		// exclude suggestions (which might also contain fields)
		let sug = form.querySelector("simplete-suggestions");
		sug.parentNode.removeChild(sug);

		return serializeForm(form);
	}

	httpRequest(method, uri, headers, body) {
		let options = {
			method,
			credentials: this.cors ? "include" : "same-origin"
		};
		if(headers) {
			options.headers = headers;
		}
		if(body) {
			options.body = body;
		}
		return fetch(uri, options).
			then(res => {
				if(!res.ok) {
					throw new Error(`unexpected response: ${res.status}`);
				}
				return res.text();
			});
	}

	get blank() {
		return !this.searchField.value.trim();
	}

	get searchField() { // TODO: memoize, resetting cached value on blur?
		let selector = this.getAttribute("search-field-selector");
		return this.querySelector(selector || DEFAULTS.searchFieldSelector);
	}

	get formParams() {
		let form;

		let uri = this.getAttribute("action");
		if(!uri) {
			form = this.form;
			uri = form.getAttribute("action");
		}

		let method = this.getAttribute("method");
		if(!method) {
			if(!form) {
				form = this.form;
			}
			method = form.method || "GET";
		}

		return {
			uri,
			method: method.toUpperCase()
		};
	}

	get form() {
		return this.closest("form");
	}

	get queryDelay() {
		let value = this.getAttribute("query-delay");
		return value ? parseInt(value, 10) : DEFAULTS.queryDelay;
	}

	get cors() {
		return this.hasAttribute("cors");
	}
}