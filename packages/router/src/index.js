import { isFunction, isUndefined, Null, ObjectKeys } from 'trimkit';

const VARMATCH_RE = /:([^\/]+)/g;
const ROUTEELEMENT_RE = /^[^\/]+$/;
const nop = () => 1;
const digestRoutes = (routes, baseUrl) =>
    routes.map((route, i) => {
        const reg = route.path.replace(VARMATCH_RE, (m, varName) => {
            const varDef = route.vars || {};
            const regExStr = '' + (varDef[varName] || /[^\/]+/);
            return '(' + regExStr.substring(1, regExStr.lastIndexOf('/')) + ')';
        });

        return {
            matcher: new RegExp(`^${baseUrl}${reg}$`),
            _i: i,
            ...route
        };
    });

export function Router(routes, baseUrl = '#') {
    let listening = false;
    let currentRoute = Null;
    let reEnterHook = Null;

    let routeMatcher = digestRoutes(routes, baseUrl);
    let routeByName = routeMatcher.reduce(
        (obj, route) =>
            (route.name ? Object.assign(obj, { [route.name]: route }) : obj),
        {}
    );

    function goto(urlOrName, vars, fromLocation) {
        const url = urlOrName.startsWith(baseUrl)
            ? urlOrName
            : href(urlOrName, vars);

        if (listening && _location() !== url) {
            // If we're not there make the change and exit.
            location.hash = url;
            return;
        }

        if (currentRoute && currentRoute.path === url) {
            // This is only supposed to happen when recovering from a bad path.
            return;
        }

        let routeVars = {};

        const routeMatch = routeMatcher.find(({ matcher, path }) => {
            const match = url.match(matcher);
            if (!match) {
                return false;
            }

            if (path.indexOf(':') !== -1) {
                match.shift();
                path.replace(VARMATCH_RE, (_, varName) => {
                    // We're abusing RegExp.replace here and it's awesome!
                    routeVars[varName] = match.shift();
                });
            }

            return true;
        });

        if (routeMatch) {
            let newRoute = {
                name: routeMatch.name,
                vars: routeVars,
                path: url,
                _i: routeMatch._i
            };
            if (
                currentRoute &&
                currentRoute._i === newRoute._i &&
                isFunction(reEnterHook)
            ) {
                const result = reEnterHook(newRoute);
                currentRoute = newRoute;
                return Promise.resolve(result);
            } else {
                let exit = currentRoute && currentRoute._i
                    ? routes[currentRoute._i].exit || nop
                    : nop;
                return Promise.resolve(exit(api, currentRoute, newRoute))
                    .catch(() => {})
                    .then(() => {
                        reEnterHook = routes[routeMatch._i].enter(
                            api,
                            newRoute
                        );
                        currentRoute = newRoute;
                    });
            }
        } else if (currentRoute && fromLocation) {
            // If we are listening and we receive an unmatched path, go back.
            location.hash = currentRoute.path;
            return;
        }
        // Either we received a goto call or a start call to in invalid path.
        throw new Error(`No route for "${url}"`);
    }

    function href(routeName, vars) {
        const route = routeByName[routeName];
        if (!route) {
            throw new Error(`Invalid route ${routeName}.`);
        }

        let path = '' + route.path;

        if (route.vars) {
            path = path.replace(VARMATCH_RE, (_, varName) => {
                let value = vars[varName];
                if ((route.vars[varName] || ROUTEELEMENT_RE).test(value)) {
                    value = isUndefined(value) ? '' : '' + value;
                    return value;
                }

                throw new Error(
                    `Invalid value for route ${path} var ${varName}: ${value}.`
                );
            });
        }
        return `${baseUrl}${path}`;
    }

    function _location() {
        return location.hash;
    }

    function _handler() {
        goto(_location(), Null, true);
    }

    function start(initialRoute) {
        if (listening) {
            return;
        }

        self.addEventListener('hashchange', _handler, false);
        listening = true;
        goto(_location() || initialRoute);
    }

    function stop() {
        self.removeEventListener('hashchange', _handler);
    }

    function current() {
        return currentRoute;
    }

    const api = {
        goto,
        href,
        start,
        stop,
        current
    };

    return api;
}
