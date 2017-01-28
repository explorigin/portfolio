import { isFunction } from 'trimkit';

import { sanitizeObject, supportsPassive } from './utils.js';


const OVERRIDING_EVENTS = ['contextmenu','dragover','drop'];
function getEventList(element) {
    return (element.getAttribute('evl') || '').split(';');
}

export function Projector(domRoot) {
    const elementMap = new Map();
    const pendingFrames = [];
    const eventCallbacks = [];
    let runningNextFrame;

    function eventHandler(evt) {
        if (OVERRIDING_EVENTS.includes(eventName)) {
            evt.preventDefault();
        };

        const fakeEvt = sanitizeObject(evt);
        if (evt.target) {
            fakeEvt.target = evt.target._id;
        }

        eventCallbacks.forEach(cb => cb(fakeEvt));
    }
    function removeEvent(eventSet, id, eventName) {
        eventSet.remove(element._id);
        if (!eventSet.size) {
            domRoot.removeEventListener(eventName, eventHandler);
        }
    }

    function setAttributes(element, props) {
        Object.entries((name, value) => {
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
        t as type,
        n as name,
        p as props,
        i as id,
        c as children
    }) {
        let element;
        if (type === 3) {
            element = document.createTextNode(props.textContent);
        } else if (type === 1) {
            element = document.createElement(name);
        }
        setAttributes(element, props);
        elementMap.set(element._id = id, element);

        for (let i=0; i<children.length; i++) {
            element.appendChild(createElement(children[i]));
        }
    }

    function _removeElement(parent, childrenToRemove) {
        childrenToRemove.forEach(function (id) {
            const child = getElement(id);
            _removeElement(child, asArray(child.childNodes).map(c => c._id)))

            getEventList(child).forEach(eventName => {
                removeEvent(
                    eventMap.get(eventName),
                    child._id,
                    eventName
                );
            });

            parent.removeChild(child);
        });
    }

    const ACTION_METHODS = [
        function addElement(parentId, data, nextSiblingId) {
            getElement(parentId)
                .insertBefore(
                    createElement(data),
                    getElement(nextSiblingId)
                );
        },
        setAttributes,
        function removeElement(parentId, childrenToRemove) {
            _removeElement(getElement(parentId), childrenToRemove);
        },
    ];

    const queuePatch = (patchFrame) => {
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
        // console.group('PatchSet');
        let patch;
        while (patch = patchSet.shift()) {
            // console.log(ACTION_METHODS[patch[0]].name, JSON.stringify(patch));
            ACTION_METHODS[patch[0]](patchParams[1], patchParams[2], patchParams[3]);
        }

        while(postProcessing.length) { postProcessing.pop()(); }
        // console.groupEnd('PatchSet');

        if (pendingFrames.length) {
            runningNextFrame = requestAnimationFrame(updateFrame, domRoot);
        } else {
            runningNextFrame = null;
        }
    };

    function getElement(id) {
        return elementMap.get(id);
    }

    return {
        queuePatch,
        getElement,
        subscribe,
    };
}
