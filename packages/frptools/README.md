# FRP tools

Property and Computed value stores designed to work together for storing real and derived state.

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

### Subscribe to changes

Call the `subscribe` method with a callback that will be called when the property value changes.  The returned function can be called to unsubscribe from the property. When called it will provide the count of remaining subscriptions.

```js
const unsubscribe = inViewport.subscribe(console.log.bind(console))
const remainingSubscriptionCount = unsubscribe();

inViewport.unsubscribeAll(); // Call unsubscribeAll to remove child property/computed subscriptions.
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

# [bundle](./src/bundle.js)

`bundle` is a wrapper around a group of properties for the purpose of applying changes to all of them at once without having to trigger a subscription that may depend on more than property in the group.

Another way to think of a `bundle` is a `property` that takes an object and exposes the object's properties as individual `property` instances.

## Behavior
A `bundle` wraps properties to intercept dependency hooks in such a way that updating all `property` instances can happen at once before any downstream `computed` instances are evaluated. A bundle returns a function that can be called with an object to set values for the mapped member `property` instances.

## Usage

### Creation

```js
const layoutEventBundle = bundle({
    width: prop(1),
    height: prop(2),
});
const ratio = computed((a, b) => a / b, [layoutEventBundle.width, layoutEventBundle.height]);
ratio.subscribe(render);
```

### Change Member Properties atomically
```js
layoutEventBundle({width: 640, height: 480});
```

`ratio` would normally be evaluated twice and `render` would be called after each intermediate change.  But bundle allows both values to change and `ratio` will only be evaluated once and `render` called once.


### Change Member Properties individually
```js
layoutEventBundle.width(640);
layoutEventBundle.height(480);
```

The properties exposed by the bundle can also be updated apart from their grouping.
