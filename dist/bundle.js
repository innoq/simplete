(function () {
'use strict';

function selectLast(node, selector) {
	var nodes = node.querySelectorAll(selector);
	var length = nodes.length;

	return length ? nodes[length - 1] : null;
}

/* eslint-env browser */

// generates custom events
// `emitter` is a DOM node
// `options` is passed through to `CustomEvent` (cf.
// https://developer.mozilla.org/en-US/docs/Web/API/Event/Event#Values)
function dispatchEvent(emitter, name, payload, options = {}) {
	if(payload) {
		options.detail = payload;
	}
	let ev = new CustomEvent(name, options);
	emitter.dispatchEvent(ev);
}

// generate a native DOM event (e.g. simulating a click interaction)
// adapted from http://stackoverflow.com/a/2706236
function dispatchDOMEvent(node, name) {
	let ev = document.createEvent("Events");
	ev.initEvent(name, true, false);
	node.dispatchEvent(ev);
}

// binds the specified `methods`, as identified by their names, to the given `ctx` object
function bindMethodContext(ctx, ...methods) {
	methods.forEach(name => {
		ctx[name] = ctx[name].bind(ctx);
	});
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();









var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};



















var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

/* eslint-env browser */
var TAG = "simplete-suggestions";
var DEFAULTS$1 = {
	itemSelector: "li",
	fieldSelector: "input[type=hidden]",
	resultSelector: "a"
};

var SimpleteSuggestions = function (_HTMLElement) {
	inherits(SimpleteSuggestions, _HTMLElement);

	// NB: `self` only required due to document-register-element polyfill
	function SimpleteSuggestions(self) {
		var _this, _ret;

		classCallCheck(this, SimpleteSuggestions);

		self = (_this = possibleConstructorReturn(this, (SimpleteSuggestions.__proto__ || Object.getPrototypeOf(SimpleteSuggestions)).call(this, self)), _this);

		bindMethodContext(self, "onQuery", "onResults", "onCycle", "onConfirm", "onAbort");

		return _ret = self, possibleConstructorReturn(_this, _ret);
	}

	createClass(SimpleteSuggestions, [{
		key: "connectedCallback",
		value: function connectedCallback() {
			this.setAttribute("aria-live", "polite");

			this.addEventListener("click", this.onSelect);
			this.nonLocalHandlers("+");
		}
	}, {
		key: "disconnectedCallback",
		value: function disconnectedCallback() {
			this.nonLocalHandlers("-");
		}
	}, {
		key: "onQuery",
		value: function onQuery(ev) {
			var detail = ev.detail;

			if (detail && detail.reset) {
				this.render("");
			} else {
				this.render(null, true);
			}
		}
	}, {
		key: "onResults",
		value: function onResults(ev) {
			var _this2 = this;

			// TODO: rename
			this.render(ev.detail.html);

			// determine and cache selectors
			var attribs = {
				itemSelector: "data-item-selector",
				fieldSelector: "data-field-selector",
				resultSelector: "data-result-selector"
			};
			Object.keys(attribs).forEach(function (prop) {
				var attr = attribs[prop];
				// NB: parent node is used to work around `querySelector` limitation
				//     WRT immediate child elements -- XXX: not actually necessary?
				var container = _this2.parentNode.querySelector(TAG + " > [" + attr + "]");
				var selector = container && container.getAttribute(attr);
				_this2[prop] = selector || DEFAULTS$1[prop];
			});
		}
	}, {
		key: "onCycle",
		value: function onCycle(ev) {
			var next = ev.detail.direction === "next";
			var selector = this.itemSelector;

			var currentItem = this.querySelector(selector + "[aria-selected]");
			if (!currentItem) {
				// select edge item, if any
				currentItem = next ? this.querySelector(selector) : selectLast(this, selector);
			} else {
				// select adjacent item or wrap around
				currentItem.removeAttribute("aria-selected");

				var items = [].concat(toConsumableArray(this.querySelectorAll(selector)));
				var index = items.indexOf(currentItem);
				if (next) {
					currentItem = items[index + 1] || items[0];
				} else {
					currentItem = index > 0 ? items[index - 1] : items[items.length - 1];
				}
			}

			if (currentItem) {
				currentItem.setAttribute("aria-selected", "true");
				this.selectItem(currentItem, true);
			}
		}
	}, {
		key: "onConfirm",
		value: function onConfirm(ev) {
			var selector = (this.itemSelector + "[aria-selected] " + this.resultSelector).trim(); // just to be safe
			var currentItem = this.querySelector(selector);
			if (currentItem) {
				// FIXME: this doesn't work for results (as opposed to suggestions) as
				//        there we'd have to click on the link (or whatever) _within_
				dispatchDOMEvent(currentItem, "click"); // XXX: hacky?
			}
		}
	}, {
		key: "onAbort",
		value: function onAbort(ev) {
			this.render("");
		}
	}, {
		key: "onSelect",
		value: function onSelect(ev) {
			this.selectItem(ev.target);
			ev.preventDefault();
		}
	}, {
		key: "selectItem",
		value: function selectItem(node, preview) {
			var field = node.querySelector(this.fieldSelector);
			if (!field) {
				return; // let the browser's default behavior kick in
			}

			if (!preview) {
				this.render("");
			}
			var name = field.name,
			    value = field.value;

			dispatchEvent(this.root, "simplete-selection", { name: name, value: value, preview: preview });
		}
	}, {
		key: "render",
		value: function render(suggestions, pending) {
			if (pending) {
				this.setAttribute("aria-busy", "true");
			} else {
				this.removeAttribute("aria-busy");
			}

			if (suggestions || suggestions === "") {
				this.innerHTML = suggestions;
			} // NB: intentionally not erasing suggestions otherwise to avoid flickering
		}
	}, {
		key: "nonLocalHandlers",
		value: function nonLocalHandlers(op) {
			op = {
				"+": "addEventListener",
				"-": "removeEventListener"
			}[op];
			var root = this.root;

			root[op]("simplete-query", this.onQuery);
			root[op]("simplete-response", this.onResults);
			root[op]("simplete-nav", this.onCycle);
			root[op]("simplete-confirm", this.onConfirm);
			root[op]("simplete-abort", this.onAbort);
		}
	}, {
		key: "root",
		get: function get$$1() {
			return this.closest("simplete-form");
		}
	}]);
	return SimpleteSuggestions;
}(HTMLElement);



customElements.define(TAG, SimpleteSuggestions);

// limits the rate of `fn` invocations
// `delay` is the rate limit in milliseconds
// `ctx` (optional) is the function's execution context (i.e. `this`)
// `fn` is the respective function
// adapted from StuffJS <https://github.com/bengillies/stuff-js>
function debounce(delay, ctx, fn) {
	if(fn === undefined) { // shift arguments
		fn = ctx;
		ctx = null;
	}

	let timer;
	return function() {
		let args = arguments;
		if(timer) {
			clearTimeout(timer);
			timer = null;
		}
		timer = setTimeout(_ => {
			fn.apply(ctx, args);
			timer = null;
		}, delay);
	};
}

/* eslint-env browser */
var DEFAULTS = {
	searchFieldSelector: "input[type=search]",
	queryDelay: 200 // milliseconds
};

// poor man's `Symbol`s
var PREVIEW = {}; // TODO: rename
var RESET = {};

var SimpleteForm = function (_HTMLElement) {
	inherits(SimpleteForm, _HTMLElement);

	// NB: `self` only required due to document-register-element polyfill
	function SimpleteForm(self) {
		var _this, _ret;

		classCallCheck(this, SimpleteForm);

		self = (_this = possibleConstructorReturn(this, (SimpleteForm.__proto__ || Object.getPrototypeOf(SimpleteForm)).call(this, self)), _this);

		bindMethodContext(self, "onInput", "onResponse");

		return _ret = self, possibleConstructorReturn(_this, _ret);
	}

	createClass(SimpleteForm, [{
		key: "connectedCallback",
		value: function connectedCallback() {
			var tag = "simplete-suggestions";
			if (!this.querySelector(tag)) {
				// guard against repeat initialization
				var results = document.createElement(tag);
				this.appendChild(results);
			}

			var field = this.searchField;
			field.setAttribute("autocomplete", "off");

			var onQuery = debounce(this.queryDelay, this, this.onQuery);
			this.addEventListener("input", onQuery);
			this.addEventListener("change", onQuery);
			this.addEventListener("simplete-selection", this.onSelect);
			field.addEventListener("keydown", this.onInput);
		}
	}, {
		key: "onQuery",
		value: function onQuery(ev) {
			var _this2 = this;

			// ignore previews as well as redundant activation via selection
			if (this.selecting) {
				delete this.selecting;
				return;
			}
			this.query = this.searchField.value;

			var res = this.submit();
			if (res === RESET) {
				dispatchEvent(this, "simplete-query", { reset: true });
			} else if (res) {
				this.setAttribute("aria-busy", "true");

				res.then(this.onResponse).
				// eslint-disable-next-line handle-callback-err
				catch(function (err) {
					return void _this2.onResponse(null);
				});

				dispatchEvent(this, "simplete-query");
			}

			ev.stopPropagation();
		}
	}, {
		key: "onResponse",
		value: function onResponse(html) {
			this.removeAttribute("aria-busy");
			dispatchEvent(this, "simplete-response", { html: html }); // TODO: rename event and payload?
		}
	}, {
		key: "onInput",
		value: function onInput(ev) {
			// ignore potential keyboard shortcuts
			if (ev.ctrlKey || ev.altKey || ev.metaKey) {
				return;
			}

			switch (ev.code || ev.key || ev.keyCode) {
				case "ArrowUp":
				case "Numpad8":
				case 38:
					// arrow up
					dispatchEvent(this, "simplete-nav", { direction: "prev" });
					break;
				case "ArrowDown":
				case "Numpad2":
				case 40:
					// arrow down
					dispatchEvent(this, "simplete-nav", { direction: "next" });
					break;
				case "Enter":
				case 13:
					// Enter
					// let the browser's default behavior (typically form submission)
					// kick in unless we're in the process of navigating suggestions
					if (this.navigating === PREVIEW) {
						dispatchEvent(this, "simplete-confirm"); // TODO: rename?
						ev.preventDefault();
					}
					break;
				case "Escape":
				case 27:
					// Escape
					var query = this.query;

					if (query) {
						// restore original (pre-preview) input
						this.searchField.value = query;
						delete this.selecting;
						dispatchEvent(this, "simplete-abort"); // TODO: rename?
						ev.preventDefault();
					}
					break;
			}
		}
	}, {
		key: "onSelect",
		value: function onSelect(ev) {
			var _ev$detail = ev.detail,
			    value = _ev$detail.value,
			    preview = _ev$detail.preview;

			this.selecting = preview ? PREVIEW : true;
			this.payload = this.serialize();
			this.searchField.value = value;
		}
	}, {
		key: "submit",
		value: function submit() {
			// guard against blank search terms
			// NB: if someone wanted to provide generic recommendations instead of
			//     aborting, they could override `#blank`
			if (this.blank) {
				delete this.payload;
				return RESET;
			}
			// guard against redundant requests
			var payload = this.serialize();
			if (payload === this.payload) {
				return;
			}
			this.payload = payload;

			var _formParams = this.formParams,
			    uri = _formParams.uri,
			    method = _formParams.method;
			// TODO: strip existing query string from URI, if any? should be invalid

			if (method === "GET") {
				return this.httpRequest(method, uri + "?" + payload);
			} else {
				var headers = {
					"Content-Type": "application/x-www-form-urlencoded"
				};
				return this.httpRequest(method, uri, headers, payload);
			}
		}
	}, {
		key: "serialize",
		value: function serialize() {
			// generate temporary form
			var form = document.createElement("form");
			[].concat(toConsumableArray(this.children)).forEach(function (node) {
				var clone = node.cloneNode(true);
				form.appendChild(clone);
			});
			// exclude suggestions (which might contain hidden fields)
			var sug = form.querySelector("simplete-suggestions");
			sug.parentNode.removeChild(sug);

			var payload = new FormData(form);
			// stringify as `application/x-www-form-urlencoded` -- XXX: crude?
			// note that this means file uploads are not supported - which should be
			// fine for our purposes here
			var params = [];
			[].concat(toConsumableArray(payload)).forEach(function (value, key) {
				var param = [key, value].map(encodeURIComponent).join("=");
				params.push(param);
			});
			return params.join("&");
		}
	}, {
		key: "httpRequest",
		value: function httpRequest(method, uri, headers, body) {
			var _this3 = this;

			var options = {
				method: method,
				credentials: this.cors ? "include" : "same-origin"
			};
			if (headers) {
				options.headers = headers;
			}
			if (body) {
				options.body = body;
			}
			return fetch(uri, options).then(function (res) {
				_this3.verifyResponse(res.status);
				return res.text();
			});
		}
	}, {
		key: "verifyResponse",
		value: function verifyResponse(status) {
			if (status < 200 || status > 299) {
				// XXX: crude?
				throw new Error("unexpected response: " + status);
			}
		}
	}, {
		key: "blank",
		get: function get$$1() {
			return !this.searchField.value.trim();
		}
	}, {
		key: "searchField",
		get: function get$$1() {
			// TODO: memoize, resetting cached value on blur?
			var selector = this.getAttribute("search-field-selector");
			return this.querySelector(selector || DEFAULTS.searchFieldSelector);
		}
	}, {
		key: "formParams",
		get: function get$$1() {
			var method = (this.getAttribute("method") || "GET").toUpperCase();
			return {
				uri: this.getAttribute("action"),
				method: method
			};
		}
	}, {
		key: "queryDelay",
		get: function get$$1() {
			var value = this.getAttribute("query-delay");
			return value ? parseInt(value, 10) : DEFAULTS.queryDelay;
		}
	}, {
		key: "cors",
		get: function get$$1() {
			return this.hasAttribute("cors");
		}
	}]);
	return SimpleteForm;
}(HTMLElement);

customElements.define("simplete-form", SimpleteForm);

}());
