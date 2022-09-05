export function selectLast(node, selector) {
	let nodes = node.querySelectorAll(selector);
	let { length } = nodes;
	return length ? nodes[length - 1] : null;
}

export function insertAfter(newNode, referenceNode) {
	referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

// NB: only supports vertical scrolling
export function scrollIfNecessary(node) {
	let parentDimensions = node.parentElement.getBoundingClientRect();
	let nodeDimensions = node.getBoundingClientRect();

	let parentTop = parentDimensions.top;
	let nodeTop = nodeDimensions.top;

	if((nodeTop + nodeDimensions.height) >
		(parentDimensions.top + parentDimensions.height)) {
		// NB: uses boolean parameter because IE11 doesn't support object parameter
		node.scrollIntoView(false);
	} else if(nodeTop < parentTop) {
		// NB: uses boolean parameter because IE11 doesn't support object parameter
		node.scrollIntoView(true);
	}
}
