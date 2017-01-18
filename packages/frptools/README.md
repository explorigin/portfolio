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

Call the subscribe method with a callback that will be called when the observable is changed to a different value.

```js
inViewport.subscribe(console.log.bind(console))
```


# [computed](./src/computed.js)

`computed` is a functional store that depends on the values of observables or other computeds. They derive value from observables rather than store value and hence cannot be set directly.

## Behavior
A `computed` will subscribe to its dependencies in such a way that it will be marked as *dirty* when any dependency changes. Whenever it is read from, if will recompute if it is dirty, otherwise it just return the stored result from the last time it computed.

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
