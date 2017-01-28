# Projector

A DOM-abstraction communicator. Projector consumes patches to update the DOM in *frames* and provides sanitized event objects to subscribers.

# Usage

## Instantiation

```js
const projector = Projector(rootElement):

projector.subscribe(evt => {
    console.log(`Received ${evt.type} event from:`, projector.getElement(evt.target));
);

projector.queuePatch(/* array of patches */);
```
