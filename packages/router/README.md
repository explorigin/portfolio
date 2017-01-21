Usage:

Router(rootURL, routeSpec, onUnmatched):

rootURL (string)
    the url prefix of all paths.

routeSpec (object)

onUnmatched (optional function(api, badPath, lastGoodRoute))
    Called whenever an unmatched route is navigated. Parameters are:
        api (Router instance)
        badpath (string)
        lastGoodRoute (object)
            a route descriptor object for the last good route.

returns an api object:
    goto(path) - match the path to a route and navigate there
    href(pathName, vars) - build a path based on the name and supplied vars
    listen() - listen to window.onhashchange for route changes
    current() - get the current route descriptor object

Example:

```js
const router = Router(
    '#',
    {
        'home': {
            path: '/',
            onenter: (r, route) => {
                console.log('At application home');
            },
            onexit: (r, route, newRoute) => {
                console.log(`Exiting from ${route.path} to ${newRoute.path}`);
            }
        },
        'article': {
            path: '/article/:id',
            vars: {id: /[a-f0-9]{6,40}/},
            onenter: (r, route) => {
                console.log('Opening Article', route.vars.id);
            },
            onexit: (r, route, newRoute) => {
                console.log('Closing Article', route.vars.id);
            }
        },
    },
    (r, path, lastGoodRoute) => {
        alert(`Unmatched route "${path}"`);
        r.goto(lastGoodRoute.path || 'home');
    }
);
```
