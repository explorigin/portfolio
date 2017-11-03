# FRP tools

Observer and computed value stores designed to work together for storing real state and derived state.

# [observable](./src/observable.js)

`observable` is a simple value store that can report when its value changes. It is good for wrapping external props passed into a component so compute types can dependent on them.

## Usage

### Creation

Creates and sets initial value to `true`

```js
const inViewport = observable(true);
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

Call the `subscribe` method with a callback that will be called when the observable is changed to a different value.  The returned function can be called to unsubscribe from the observable. When called
it will provide the count of remaining subscriptions.

```js
const unsubscribe = inViewport.subscribe(console.log.bind(console))
const remainingSubscriptionCount = unsubscribe();

inViewport.unsubscribeAll(); // Call unsubscribeAll to remove child observables/computeds.
```

### Provide a comparator for complex types

When storing a type that is not determined to be equal with simple equality (===), provide a function to determine in the new provided value should be propagated to dependents.

```js
    function setEquals(a, b) {
        return (
            a instanceof Set
            && b instanceof Set
            && [...a].reduce((acc, d) => acc && b.has(d), true)
            && [...b].reduce((acc, d) => acc && a.has(d), true)
        );
    }

    const a = observable(new Set([1, 2]), setEquals);
```

# [computed](./src/computed.js)

`computed` is a functional store that depends on the values of observables or other computeds. They derive value from observables rather than store value and hence cannot be set directly.

## Behavior
A `computed` will subscribe to its dependencies in such a way that it will be marked as *dirty* when any dependency changes. Whenever it is read from, if will recompute its result if the *dirty* flag is set, otherwise it just return the stored result from the last time it computed.

## Usage

### Creation

```js
const showDialog = computed(
    (inVP, shouldShow) => (inVP && shouldShow),  // computation function
    [inViewport, shouldShow]  // array of dependencies, can be either observable or computed
);
```

### Read
```js
if (showDialog()) { /* showDialog() is truthy */ }
```

Call it to receive the stored value, recomputing if necessary.


### Subscribe to changes

Call the subscribe method with a callback that will be called when the computed result changes to a different value.  The returned function can be called to unsubscribe from the observable. When called
it will provide the count of remaining subscriptions.

```js
const unsubscribe = inViewport.subscribe(console.log.bind(console))
const remainingSubscriptionCount = unsubscribe();
```

**NOTE**: Subscribing to a computed forces it to recompute every time an upstream dependency changes.  This could negatively performance if it depends on multiple values that change sequentially and the computation function is non-trivial.  For example:

```js
const inViewport = observable(false);
const shouldShow = observable(false);

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
showDialog.unsubscribeAll(); // Call unsubscribeAll to remove child observables/computeds.
```

### Provide a comparator for complex types

When the computed result is a type that is not determined to be equal with simple equality (===), provide a function to determine in the new provided value should be propagated to dependents.

```js
    function setEquals(a, b) {
        return (
            a instanceof Set
            && b instanceof Set
            && [...a].reduce((acc, d) => acc && b.has(d), true)
            && [...b].reduce((acc, d) => acc && a.has(d), true)
        );
    }

    function _intersection(a, b) {
        return new Set([...a].filter(x => b.has(x)));
    }

    const a = observable(new Set([1, 2]), setEquals);
    const b = observable(new Set([2, 3]), setEquals);
    const intersection = computed(_intersection, [a, b], setEquals);
```

# [bundle](./src/bundle.js)

`bundle` is a wrapper around a group of `observables` for the purpose of applying changes to all of them at once without having to trigger a subscription that may depend on more than observable in the group.

Another way to think of a `bundle` is an `observable` that takes an object and exposes the properties as individual observables.

## Behavior
A `bundle` wraps observables to intercept dependency hooks in such a way that updating all observables can happen at once before any downstream `computeds` are evaluated. A bundle returns a function that can be called with an object to set values for the mapped member observables.

## Usage

### Creation

```js
const layoutEventBundle = bundle({
    width: observable(1),
    height: observable(2),
});
const ratio = computed((a, b) => a / b, [layoutEventBundle.width, layoutEventBundle.height]);
ratio.subscribe(render);
```

### Change Member Observables atomically
```js
layoutEventBundle({width: 640, height: 480});
```

`ratio` would normally be evaluated twice and `render` would be called after each intermediate change.  But bundle allows both values to change and `ratio` will only be evaluated once and `render` called once.


### Change Member Observables individually
```js
layoutEventBundle.width(640);
layoutEventBundle.height(480);
```

The observables exposed by the bundle can also be updated apart from their grouping.
