# Simplete _/sɪmˈpliːt/_

Simplete ([demo](http://innoq.github.io/simplete/)) is a
[custom element](https://www.webcomponents.org/introduction#custom-elements) for
autocompletion, using HTML fragments dynamically requested from the server. It
is suitable both for context completion and quicksearch results.

Simplete relies on established form semantics and leaves markup up to the
server. In contrast to most autocompletion libraries (see
[alternatives](#alternatives)), which typically rely on JSON responses and
client-side templating, this typically reduces complexity and increases
flexibility.

In addition to progressive enhancement, accessibility has been a major driver
in the design and implementation (largely thanks to
[Heydon Pickering](https://www.heydonworks.com)'s inspiring evangelism).


Usage
-----

We start out with a fairly straightforward form:

```html
<form action="/search" method="get">
    <simplete-form>
        <input type="search" name="query">
    </simplete-form>

    <button>search</button>
</form>
```

Or, if we want to target different resources:

```html
<form action="/search" method="get">
    <simplete-form action="/search/suggestions" method="get">
        <input type="search" name="query">
    </simplete-form>

    <button>search</button>
</form>
```

Typing into that search field will result in a form submission (i.e. a
`GET /search/suggestions?query=…` AJAX request).

Typically the server would respond with HTML like the following:

```html
<ol aria-label="2 search suggestions">
    <li>
        <input type="hidden" value="foo">
        lorem ipsum
    </li>
    <li>
        <input type="hidden" value="bar">
        dolor sit amet
    </li>
</ol>
```

Selecting an item from that list will populate the search field with the
corresponding value or the text content of the item, which may subsequently be
used to submit the surrounding form. (Note that keyboard-based submission of
the surrounding form is only suppressed while navigating results.)

The server might also choose to respond with immediate results rather than query
suggestions:

```html
<ol aria-label="2 search suggestions">
    <li>
        <a href="http://example.org">example.org</a>
    </li>
    <li>
        <a href="http://example.com">example.com</a>
    </li>
</ol>
```

In fact, such HTML responses are not limited to any particular markup: The
server is free to include multiple lists, contextual feedback messages or
whatever seems appropriate (see [customization](#customization) below).

The `styles` directory contains some basic suggested CSS while `demo/demo.css`
contains a rudimentary theme.

Note that when a result is selected, a `"simplete-selection"` custom event is
triggered on the associated `<simplete-form>` element. The respective value is
accessible via `event.detail.value`.

### Customization

`<simplete-form>` may optionally be configured with the following attributes:

* `search-field-selector` (defaults to `"input[type=search]"`) is a selector
  identifying a search field (must be a unique child element)
* `query-delay` (defaults to `200`) is the number of milliseconds to wait before
  triggering an HTTP request
* `min-length` (defaults to `1`) is the minimal input length required before
  triggering an HTTP request
* `cors` is a boolean attribute which, if present, ensures
  [credentials](https://fetch.spec.whatwg.org/#credentials) are included with
  cross-origin requests

```html
<simplete-form search-field-selector="textarea" query-delay="100" cors>
    <textarea></textarea>

    <label>
        <input type="checkbox" name="case-sensitive" value="1">
        case-sensitive
    </label>
</simplete-form>
```

Similarly, server responses may optionally use attributes to identify content
elements via selectors:

* `data-item-selector` (defaults to `"li"`) identifies results
* `data-field-selector` (defaults to `"input[type=hidden]"`) identifies fields
  whose `value` will be used for populating the search field
* `data-result-selector` (defaults to `"a"`) identifies elements which represent
  immediate results

```html
<section data-item-selector="article h3"
        data-field-selector="button[type=button]"
        data-result-selector="button[type=submit]">
    <article>
        <h3>Hello World</h3>
        <p>lorem ipsum dolor sit amet</p>
        <button type="submit">upvote</button>
    </article>

    <article>
        <h3>…</h3>
        <p>…</p>
        <button type="submit">upvote</button>
    </article>
</simplete-form>
```


### Accessibility

Simplete will add the ARIA roles and attributes necessary in order for the
autocomplete component to work with assistive technologies.

While it is possible to [customize](#customization) the component with
arbitrary HTML, we recommend using a semantic HTML list (`ol` or `ul`) with a
corresponding
[aria-label](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label),
because we have performed screenreader tests for this markup
(`aria-label` was necessary in order for the list of suggestions to be
announced as a list in NVDA).

We also recommend performing usability testing for your implementation of the
component. The general expectation for a component like this is that selecting
a result from the list of suggestions will behave in the same way as if that
suggestion were entered into the search field and the form were submitted. If
your links do not behave accordingly (e.g. if your search suggestions are links
to a concrete page instead of to a list of search suggestions), you will need
to find a way to communicate this to the user.


Dependencies
------------

Simplete has no external dependencies (though it includes a few tiny utility
functions from [uitil](https://github.com/FND/uitil)).

However, it does rely on modern browser features which might have to be
polyfilled:

* custom elements — suggested polyfill:
  [@ungap/custom-elements](https://github.com/ungap/custom-elements)
* `fetch` — suggested polyfill: [whatwg-fetch](https://github.com/github/fetch)
  or [unfetch](https://github.com/developit/unfetch)
* `CustomEvent`
* `Element#closest`
* `Array#from`
* `Object.assign`

The Financial Times's excellent
[polyfill service](https://github.com/Financial-Times/polyfill-service) is a
good source for additional polyfills.

The source code is written in ES2015, without relying on non-standardized
language extensions.


Contributing
------------

* ensure [Node](http://nodejs.org) is installed
* `npm install` downloads dependencies
* `npm start` launches a persistent process to automatically update the
  development bundle
* `npm run compile` creates the distribution bundle
* `npm test` executes the test suite


Alternatives
------------

* [Awesomplete](http://leaverou.github.io/awesomplete/)
* [typeahead.js](http://twitter.github.io/typeahead.js/)
* [jQuery UI Autocomplete](http://jqueryui.com/autocomplete/)
* …
