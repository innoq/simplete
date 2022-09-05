/* eslint-env browser */
import SimpleteForm, { TAG as FORM_TAG } from "./form";
import SimpleteSuggestions, { TAG as SUGGESTIONS_TAG } from "./suggestions";
import SimpleteStatus, { TAG as STATUS_TAG } from "./status";

customElements.define(FORM_TAG, SimpleteForm);
customElements.define(SUGGESTIONS_TAG, SimpleteSuggestions);
customElements.define(STATUS_TAG, SimpleteStatus);
