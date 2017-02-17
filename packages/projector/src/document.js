// Originally Undom - https://github.com/developit/undom
// Copyright (c) 2016 Jason Miller
// License: MIT

/*
const NODE_TYPES = {
	ELEMENT_NODE: 1,
	ATTRIBUTE_NODE: 2,
	TEXT_NODE: 3,
	CDATA_SECTION_NODE: 4,
	ENTITY_REFERENCE_NODE: 5,
	COMMENT_NODE: 6,
	PROCESSING_INSTRUCTION_NODE: 7,
	DOCUMENT_NODE: 9
};
*/

let COUNTER = 0;

function toLower(str) {
	return String(str).toLowerCase();
}

function splice(arr, item, add, byValueOnly) {
	let i = arr ? findWhere(arr, item, true, byValueOnly) : -1;
	if (~i) add ? arr.splice(i, 0, add) : arr.splice(i, 1);
	return i;
}

function findWhere(arr, fn, returnIndex, byValueOnly) {
	let i = arr.length;
	while (i--) if (typeof fn==='function' && !byValueOnly ? fn(arr[i]) : arr[i]===fn) break;
	return returnIndex ? i : arr[i];
}

function createAttributeFilter(ns, name) {
	return o => o.ns===ns && toLower(o.name)===toLower(name);
}

/** Create a minimally viable DOM Document
 *	@returns {Document} document
 */
export function CreateDocument(onChange) {

	function isElement(node) {
		return node.nodeType===1;
	}

	class Node {
		constructor(nodeType, nodeName) {
			this.nodeType = nodeType;
			this.nodeName = nodeName;
			this.childNodes = [];
			this._id = COUNTER++;
			this._attached = false;
		}
		get nextSibling() {
			let p = this.parentNode;
			if (p) return p.childNodes[findWhere(p.childNodes, this, true) + 1];
		}
		get previousSibling() {
			let p = this.parentNode;
			if (p) return p.childNodes[findWhere(p.childNodes, this, true) - 1];
		}
		get firstChild() {
			return this.childNodes[0];
		}
		get lastChild() {
			return this.childNodes[this.childNodes.length-1];
		}
		_attach(attach) {
			this._attached = attach;
			this.childNodes.forEach(n => n._attach(attach));
		}
		_toDataObj() {
			return {
		        t: this.nodeType,
		        n: this.nodeName,
		        p: {},
		        i: this._id,
		        c: this.childNodes.map(n => n._toDataObj())
		    };
		}
		appendChild(child) {
			this.insertBefore(child);
		}
		insertBefore(child, ref) {
			child.remove();
			child.parentNode = this;
			if (!ref) {
				this.childNodes.push(child)
			} else {
				splice(this.childNodes, ref, child)
			}

			if (this._attached) {
				child._attach(true);
				onChange([0, this._id, child._toDataObj(), ref && ref._id]);
			}
		}
		replaceChild(child, ref) {
			if (ref.parentNode===this) {
				this.insertBefore(child, ref);
				ref.remove();
			}
		}
		removeChild(child) {
			splice(this.childNodes, child);
			if (this._attached) {
				child._attach(false);
				onChange([2, child._id]);
			}
		}
		remove() {
			if (this.parentNode) {
				this.parentNode.removeChild(this);
			}
		}
	}


	class Text extends Node {
		constructor(text) {
			super(3, '#text');					// TEXT_NODE
			this.nodeValue = text;
		}
		_toDataObj() {
			return {
				t: this.nodeType,
				n: this.nodeName,
				p: { textContent: this.nodeValue },
				i: this._id,
				c: []
			};
		}
		set textContent(text) {
			this.nodeValue = text;
		}
		get textContent() {
			return this.nodeValue;
		}
	}


	class Element extends Node {
		constructor(nodeType, nodeName) {
			super(nodeType || 1, nodeName);		// ELEMENT_NODE
			this.attributes = [];
			this.__handlers = {};
		}

		get children() {
			return this.childNodes.filter(isElement);
		}

		_toDataObj() {
			return {
				t: this.nodeType,
				n: this.nodeName,
				p: this.attributes,
				i: this._id,
				c: this.childNodes.map(n => n._toDataObj())
			};
		}

		setAttribute(key, value) {
			this.setAttributeNS(null, key, value);
		}
		getAttribute(key) {
			return this.getAttributeNS(null, key);
		}
		removeAttribute(key) {
			this.removeAttributeNS(null, key);
		}

		setAttributeNS(ns, name, value) {
			let attr = findWhere(this.attributes, createAttributeFilter(ns, name));
			if (!attr) this.attributes.push(attr = { ns, name });
			attr.value = String(value);
			if (this._attached) {
				onChange([1, this._id, attr]);
			}
		}
		getAttributeNS(ns, name) {
			let attr = findWhere(this.attributes, createAttributeFilter(ns, name));
			return attr && attr.value;
		}
		removeAttributeNS(ns, name) {
			splice(this.attributes, createAttributeFilter(ns, name));
			if (this._attached) {
				onChange([1, this._id, { name: name, value: null }]);
			}
		}

		addEventListener(type, handler) {
			(this.__handlers[toLower(type)] || (this.__handlers[toLower(type)] = [])).push(handler);
		}
		removeEventListener(type, handler) {
			splice(this.__handlers[toLower(type)], handler, 0, true);
		}
		dispatchEvent(event) {
			let t = event.currentTarget = this,
				c = event.cancelable,
				l, i;
			do {
				l = t.__handlers[toLower(event.type)];
				if (l) for (i=l.length; i--; ) {
					if ((l[i](event)===false || event._end) && c) break;
				}
			} while (event.bubbles && !(c && event._stop) && (event.target=t=t.parentNode));
			return !event.defaultPrevented;
		}
	}


	class Document extends Element {
		constructor() {
			super(9, '#document');			// DOCUMENT_NODE
			this._attached = true;
		}
	}


	class Event {
		constructor(type, opts) {
			this.type = type;
			this.bubbles = !!opts.bubbles;
			this.cancelable = !!opts.cancelable;
		}
		stopPropagation() {
			this._stop = true;
		}
		stopImmediatePropagation() {
			this._end = this._stop = true;
		}
		preventDefault() {
			this.defaultPrevented = true;
		}
	}


	function createElement(type) {
		return new Element(null, String(type).toUpperCase());
	}


	function createElementNS(ns, type) {
		let element = createElement(type);
		element.namespace = ns;
		return element;
	}


	function createTextNode(text) {
		return new Text(text);
	}


	function createDocument() {
		let document = new Document();
		Object.assign(document, document.defaultView = { document, Document, Node, Text, Element, SVGElement:Element, Event });
		Object.assign(document, { documentElement:document, createElement, createElementNS, createTextNode });
		document.appendChild(document.body = createElement('body'));
		return document;
	}

	return createDocument();
}
