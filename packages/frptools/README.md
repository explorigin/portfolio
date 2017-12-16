# FRP tools

Property, Container and Computed value stores designed to work together for storing discrete and derived state.

# [property](./src/property.js)

A `property` is a simple value store that can report when its value changes. It is good for wrapping external values passed into a component so compute types can dependent on them and only recompute when these values change. It can also be used to receive events such as *window.onresize* to always provide the current viewport size.

## Usage

### Creation

Creates and sets initial value to `true`

```js
const inViewport = prop(true);
```

### Read

Call it to receive the stored value.

```js
if (inViewport()) { /* inViewport is truthy */ }
```

### Change

Call it passing the new value. If any computed stores depend on this value they will be marked dirty and re-evaluated the next time they are read from.

```js
inViewport(false);
```

### Provide a hash function for complex types

When storing a type that is not determined to be equal with simple equality (===), provide a hash function to be used for simple comparison to determine if the new provided value should be propagated to dependents.

```js
    function hashSet(_a) {
        if (_a instanceof Set) {
            return Array.from(_a.keys())
                .sort()
                .map(k => `${(typeof k).substr(0, 1)}:${encodeURIComponent(k)}/`).join('?');
        }
        return _a
    }

    const a = prop(new Set([1, 2]), hashSet);
```

# [computed](./src/computed.js)

`computed` is a functional store that depends on the values of properties or other computeds. They derive value from properties rather than store value and hence cannot be set directly.

## Behavior
A `computed` will subscribe to its dependencies in such a way that it will be marked as *dirty* when any dependency changes. Whenever it is read from, if will recompute its result if the *dirty* flag is set, otherwise it just return the stored result from the last time it computed.

## Usage

### Creation

```js
const showDialog = computed(
    (inVP, shouldShow) => (inVP && shouldShow),  // computation function
    [inViewport, shouldShow]  // array of dependencies, can be either a property or computed
);
```

### Read
```js
if (showDialog()) { /* showDialog() is truthy */ }
```

Call it to receive the stored value, recomputing if necessary.


### Subscribe to changes

Call the subscribe method with a callback that will be called when the computed result changes to a different value.  The returned function can be called to unsubscribe from the property. When called it will provide the count of remaining subscriptions.

```js
const unsubscribe = inViewport.subscribe(console.log.bind(console))
const remainingSubscriptionCount = unsubscribe();
```

**NOTE**: Subscribing to a computed forces it to recompute every time an upstream dependency changes.  This could negatively performance if it depends on multiple values that change sequentially and the computation function is non-trivial.  For example:

```js
const inViewport = prop(false);
const shouldShow = prop(false);

const showDialog = computed(
    (inVP, shouldShow) => (inVP && shouldShow),
    [inViewport, shouldShow]
);

inViewport(true);  // showDialog marked as dirty but does not recompute its stored result.
shouldShow(true);  // showDialog is already marked as dirty. Nothing else happens.
showDialog();  // showDialog recomputes its stored result and unsets the dirty flag.

// adding a subscription will change showDialog's internal behavior
showDialog.subscribe(console.log.bind(console));

inViewport(false);  // showDialog result recomputed and `false` is written to the console.
shouldShow(false);  // showDialog result recomputed, console.log is not called.
showDialog();  // showDialog does not recompute, console.log is not called. `false` is returned.

showDialog.detach(); // Call detach to remove this computed from the logic tree.
showDialog.unsubscribeAll(); // Call unsubscribeAll to remove child property/computed subscriptions.
```

### Provide a hash function for complex types

When the computed result is a type that is not determined to be equal with simple equality (===), provide a hash function to be used for simple comparison to determine if the new provided value should be propagated to dependents.

```js
function hashSet(_a) {
    if (_a instanceof Set) {
        return Array.from(_a.keys())
            .sort()
            .map(k => `${(typeof k).substr(0, 1)}:${encodeURIComponent(k)}/`).join('?');
    }
    return _a
}

function _intersection(a, b) {
    return new Set([...a].filter(x => b.has(x)));
}

const a = prop(new Set([1, 2]), hashSet);
const b = prop(new Set([2, 3]), hashSet);
const intersection = computed(_intersection, [a, b], hashSet);
```

# [container](./src/container.js)

`container` is a wrapper around any container type (Object, Set, Map, or Array) while monitoring changes to the container. A container can be subscribed to and `computed` instances can depend on them.

## Behavior
Anytime a property is set or a method is gotten and called, the container will check for an updated state and trigger subscribers if it is updated.  An hash function must be applied to determine updated status.

## Usage

### Creation

```js
const monkeys = contained([], arr => arr.join('$'));
const firstMonkey = computed(m => m.length ? m[0] : null, [monkeys]);
firstMonkey.subscribe(console.log.bind.console);
```

### Add a member to the container
```js
monkeys.push('Bill')
```
*firstMonkey* would be computed and "Bill" would be logged to the console.


### Access the contained object directly

Reference the `_` (underscore) property to access the contained object directly.

```js
monkeys._.push('Bill')
```
The array in *monkeys* would get a new value without *firstMonkey* being notified of the change.


# Common Behaviors

All frptools types have the following methods available:

## `.subscribe(fn)` - Subscribe to changes

Call the `subscribe` method with a callback that will be called when the property value changes.  The returned function can be called to unsubscribe from the property. When called it will provide the count of remaining subscriptions.

```js
const unsubscribe = inViewport.subscribe(console.log.bind(console))
const remainingSubscriptionCount = unsubscribe();
```

## `.unsubscribeAll()` - Remove child subscriptions

Call the `unsubscribeAll` method to remove all child-node subscriptions.

```js
const unsubscribe = inViewport.subscribe(console.log.bind(console))
const remainingSubscriptionCount = unsubscribe();

inViewport.unsubscribeAll(); // console.log will no longer be called.
```

## `.fire(val)` - Send a value to the node's subscribers

Call the `fire` method to send a value to each of the node's subscribers. This is designed for the node to use to propagate updates but firing other values could have some uses.

```js
const unsubscribe = inViewport.subscribe(console.log.bind(console))
inViewport.fire(false); // "false" logged to console.
```
