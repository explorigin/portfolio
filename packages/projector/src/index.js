import { isFunction } from 'trimkit';

import { supportsPassive } from './utils.js';


const OVERRIDING_EVENTS = ['contextmenu','dragover','drop'];
function getEventList(element) {
    const evtString = element.getAttribute('evl');
    return evtString ? evtString.split(';') : [];
}

export function Projector(domRoot) {
    const elementMap = new Map();
    const pendingFrames = [];
    const eventCallbacks = [];
    const eventMap = new Map();
    let runningNextFrame;

    function eventHandler(evt) {
        const eventName = evt.type;
        const eventSet = eventMap.get(eventName);
        if (!eventSet || (evt.target && !eventSet.has(evt.target._id))) {
            return;
        }

        if (OVERRIDING_EVENTS.includes(eventName)) {
            evt.preventDefault();
        };

        evt.stopPropagation();

        eventCallbacks.forEach(cb => cb(evt));
    }

    function removeEvent(eventSet, id, eventName) {
        eventSet.delete(id);
        if (!eventSet.size) {
            domRoot.removeEventListener(eventName, eventHandler);
            // Probably unnecessary to remove the eventSet from the map.
            // eventMap.delete(eventName);
        }
    }

    function setAttributes(element, props) {
        Object.entries(props).forEach(([name, value]) => {
            if (name in element) {
                if (name.startsWith('on')) {
                    const eventName = name.substr(2);
                    const eventSet = eventMap.get(eventName) || new Set();
                    const eventList = getEventList(element);
                    if (value === null) {
                        // remove event
                        eventList.splice(eventList.indexOf(eventName), 1);
                        removeEvent(eventSet, element._id, eventName);
                    } else {
                        // add event
                        if (!eventSet.size) {
                            domRoot.addEventListener(
                                eventName,
                                eventHandler,
                                (
                                    (supportsPassive && !OVERRIDING_EVENTS.includes(eventName))
                                    ? { passive: true, capture: false }
                                    : false
                                )
                            );
                        }
                        eventList.push(eventName);
                        eventSet.add(element._id);
                        if (!eventMap.has(eventName)) {
                            eventMap.set(eventName, eventSet);
                        }
                    }
                    element.setAttribute('evl', eventList.join(';'));
                } else {
                    element[name] = value;
                }
            } else if (value === null) {
                element.removeAttribute(name);
            } else {
                element.setAttribute(name, value);
            }
        });
    }

    function createElement({
        t: type,
        n: name,
        p: props,
        i: id,
        c: children
    }) {
        let element;
        if (type === 3) {
            element = document.createTextNode(props.textContent);
        } else if (type === 1) {
            element = document.createElement(name);
        }
        elementMap.set(element._id = id, element);
        setAttributes(element, props);

        for (let i=0; i<children.length; i++) {
            element.appendChild(createElement(children[i]));
        }
        return element;
    }

    function removeElement(element) {
        Array.from(element.childNodes).forEach(removeElement)

        getEventList(element).forEach(eventName => {
            removeEvent(
                eventMap.get(eventName),
                element._id,
                eventName
            );
        });

        element.parentNode.removeChild(element);
        elementMap.delete(element._id);
    }

    const ACTION_METHODS = [
        function addElement(parent, data, nextSiblingId) {
            parent.insertBefore(
                createElement(data),
                getElement(nextSiblingId)
            );
        },
        setAttributes,
        removeElement,
    ];

    const queueFrame = (patchFrame) => {
        if (!patchFrame || !patchFrame.length) {
            return;
        }
        pendingFrames.unshift(patchFrame);
        if (!runningNextFrame) {
            updateFrame();
        }
    };

    const updateFrame = () => {
        const patches = pendingFrames.pop();
        if (!patches) {
            runningNextFrame = null;
            return;
        }
        // console.group('PatchSet');
        let patch;
        while (patch = patches.shift()) {
            // console.log(ACTION_METHODS[patch[0]].name, JSON.stringify(patch));
            ACTION_METHODS[patch[0]](getElement(patch[1]), patch[2], patch[3]);
        }
        // console.groupEnd('PatchSet');

        runningNextFrame = requestAnimationFrame(updateFrame, domRoot);
    };

    function getElement(id) {
        return id === null ? domRoot : elementMap.get(id);
    }

    function subscribe(fn) {
        eventCallbacks.push(fn);
    }

    return {
        queueFrame,
        getElement,
        subscribe,
    };
}
