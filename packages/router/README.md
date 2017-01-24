# Router

The core functions of router that is designed to be slim and have an easy-to-read, yet powerful API.

**NOTE** This router is geared toward offline-first apps and thus does not support pushState.

# Usage

## Instantiation

```js
const router = Router(routeSpecArray, rootURL='#'):
```

### routeSpecArray

An array of objects with the following properties:

- `name` *string* - an optional string that can be referred to in the `href` and `goto` instance methods. Duplicate names are not allowed.

- `path` *string* - the path template for this route. Path templates are matched in the order of the array. Example:

    `"/"` - for the root path
    `"/articles"` - another static path
    `"/article/:id"` - a path with a variable
    `"/:unknownRoute"` - the last route could catch erroneous routes. Unmatched urls will automatically route here.

- `vars` *object* - an optional object mapping variable names in the path template to a regular expression for validation

- `enter` *function* - a function for when this route is entered. The `enter` function receives two parameters:

    - *route instance object* - this is a object that contains properties:

        - `name` *string* - the route name
        - `vars` *object* - an object holding any variables parsed from the path
        - `path` *string* - the path as received

    - *router instance object* - (see below)

    The `enter` function may return a callback that will be called instead of the `enter` function for further navigate events that will be handled by this route (with different variables). This allows `enter` to establish a context for the route it handles.

- `exit` *function* - an optional function that will be called before calling `enter` of the next path. `exit` has the option to delay the call to `enter` by returning a promise. This is intended for handling transition animations. If the route's `enter` function returns a callback, `exit` will not be called if the same route receives navigation but with different variables. `exit` receives the parameters similarly to `enter`:

    - *route instance object* - for the route being exited
    - *route instance object* - for the route yet-to-be entered
    - *router instance object* - (see below)

### rootURL (optional string)

The url prefix of all paths. This should always be `#` unless you're nesting routers.

### router (returned object)

The returned instance provides these methods:

- `goto(url: string)` or `goto(pathName: string, vars: object)`

    Match to a route by relative url or pathName and a vars object. Navigate there.

- `href(pathName: string, vars: object)`

    Build a relative url based on the name and supplied vars.

- `start(initialRoute: string)`

    Listen to `window.onhashchange` for route changes. The `initialRoute` will be passed to `goto()` if the is no current route in `window.location`.

- `stop()`

    Cancel subscription to `window.onhashchange`

- `current()`

    Get the current *route instance object* as was provided to the current routes `enter` function.

Example:

```js
const router = Router(
    [
        {
            name: 'home',
            path: '/',
            enter: (r, route) => {
                console.log('At application home');
            },
            exit: (r, route, newRoute) => {
                console.log(`Exiting from ${route.path} to ${newRoute.path}`);
            }
        },
        {
            name: 'article',
            path: '/article/:id',
            vars: {id: /[a-f0-9]{6,40}/},
            enter: (route, router) => {
                console.log('Opening Article', route.vars.id);
                return (route, router) => {
                    console.log('Opening Article', route.vars.id);
                }
            },
            exit: (route, newRoute, router) => {
                console.log('Closing Article', route.vars.id);
            }
        },
        {
            id: '404',
            path: ':vars',
            enter: (r => r.goto('home'))
        }
    ]
);
router.start('/');
```
