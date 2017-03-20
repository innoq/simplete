/* eslint-env browser */
import "./suggestions";
import { dispatchEvent } from "uitil/dom/events";
import bindMethodContext from "uitil/method_context";
import debounce from "uitil/debounce";

const DEFAULTS = {
	searchFieldSelector: "input[type=search]",
	queryDelay: 200 // milliseconds
};

// poor man's `Symbol`s
const PREVIEW = {}; // TODO: rename
const RESET = {};

class SimpleteForm extends HTMLElement {
	// NB: `self` only required due to document-register-element polyfill
	constructor(self) {
		self = super(self);

		bindMethodContext(self, "onInput", "onResponse");

		return self;
	}

	connectedCallback() {
		let tag = "simplete-suggestions";
		if(!this.querySelector(tag)) { // guard against repeat initialization
			let results = document.createElement(tag);
			this.appendChild(results);
		}

		let field = this.searchField;
		field.setAttribute("autocomplete", "off");

		let onQuery = debounce(this.queryDelay, this, this.onQuery);
		this.addEventListener("input", onQuery);
		this.addEventListener("change", onQuery);
		this.addEventListener("simplete-selection", this.onSelect);
		field.addEventListener("keydown", this.onInput);
	}

	onQuery(ev) {
		// ignore previews as well as redundant activation via selection
		if(this.selecting) {
			delete this.selecting;
			return;
		}

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
			// let the browser's default behavior (typically form submission)
			// kick in unless we're in the process of navigating suggestions
			if(this.navigating === PREVIEW) {
				dispatchEvent(this, "simplete-confirm"); // TODO: rename?
				ev.preventDefault();
			}
			break;
		}
	}

	onSelect(ev) {
		let { value, preview } = ev.detail;
		this.selecting = preview ? PREVIEW : true;
		this.payload = this.serialize();
		this.searchField.value = value;
		// TODO: if `preview`, field value should be considered temporary - i.e. there
		//       should be a way to undo and return to the original input (e.g. via ESC)
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
		let options = {
			method,
			credentials: this.cors ? "include" : "same-origin"
		};

		// TODO: strip existing query string from URI, if any? should be invalid
		if(method === "GET") {
			uri = `${uri}?${payload}`;
		} else {
			options.headers = {
				"Content-Type": "application/x-www-form-urlencoded"
			};
			options.body = payload;
		}

		return fetch(uri, options).
			then(res => {
				this.verifyResponse(res);
				return res.text();
			});
	}

	verifyResponse(res) {
		let { status } = res;
		if(status < 200 || status > 299) { // XXX: crude?
			throw new Error(`unexpected response: ${status}`);
		}
	}

	serialize() {
		// generate temporary form
		let form = document.createElement("form");
		[...this.children].forEach(node => {
			let clone = node.cloneNode(true);
			form.appendChild(clone);
		});
		// exclude suggestions (which might contain hidden fields)
		let sug = form.querySelector("simplete-suggestions");
		sug.parentNode.removeChild(sug);

		let payload = new FormData(form);
		// stringify as `application/x-www-form-urlencoded` -- XXX: crude?
		// note that this means file uploads are not supported - which should be
		// fine for our purposes here
		let params = [];
		payload.forEach((value, key) => {
			let param = [key, value].map(encodeURIComponent).join("=");
			params.push(param);
		});
		return params.join("&");
	}

	get blank() {
		return !this.searchField.value.trim();
	}

	get searchField() { // TODO: memoize, resetting cached value on blur?
		let selector = this.getAttribute("search-field-selector");
		return this.querySelector(selector || DEFAULTS.searchFieldSelector);
	}

	get formParams() {
		let method = (this.getAttribute("method") || "GET").toUpperCase();
		return {
			uri: this.getAttribute("action"),
			method
		};
	}

	get queryDelay() {
		let value = this.getAttribute("query-delay");
		return value ? parseInt(value, 10) : DEFAULTS.queryDelay;
	}

	get cors() {
		return this.hasAttribute("cors");
	}
}

customElements.define("simplete-form", SimpleteForm);
