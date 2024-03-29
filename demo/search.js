#!/usr/bin/env node

let http = require("http");
let url = require("url");

const HOST = "0.0.0.0";
const PORT = 3003;

// cf. http://pypl.github.io/PYPL.html
const LANGUAGES = [
	"Java", "Python", "PHP", "C#", "JavaScript", "C++", "C", "Objective-C", "R",
	"Swift", "Matlab", "Ruby", "Visual Basic", "VBA", "TypeScript", "Scala",
	"Perl", "Go", "lua", "Haskell", "Delphi", "Rust"
];
const WIKIPEDIA = "https://en.wikipedia.org/wiki/Special:Search?search=";

let server = http.createServer((req, res) => {
	// eslint-disable-next-line n/no-deprecated-api
	let query = url.parse(req.url, true).query;
	query = query && query.q;

	let candidates = LANGUAGES;
	if(query) {
		let q = query.toLowerCase();
		candidates = candidates.filter(lang => lang.toLowerCase().includes(q));
	}

	let html;
	if(candidates.length === 0) {
		html = `
<p data-autocomplete-status="0 search suggestions available">No results for '${query}'.<p>
		`.trim();
	} else {
		let status = candidates.length === 1 ? "1 search suggestion available" :
			`${candidates.length} search suggestions available`;

		html = candidates.map(lang => {
			let uri = WIKIPEDIA + encodeURIComponent(lang);
			return `<li><a href="${uri}">${lang}</a></li>`;
		}).join("\n");
		html = [
			"<div>",
			`<p data-autocomplete-status="${status}">Results for '${query}':<p>\n`,
			`<ul aria-label="${candidates.length} search suggestion${candidates.length !== 1 ? "s" : ""}">`,
			html,
			"</ul>",
			"</div>"
		].join("\n");
	}

	res.writeHead(200, {
		"Access-Control-Allow-Origin": "*",
		"Content-Type": "text/html"
	});
	res.end(html);
});

server.listen(PORT, HOST, () => {
	console.log(`→ http://${HOST}:${PORT}`); // eslint-disable-line no-console
});
