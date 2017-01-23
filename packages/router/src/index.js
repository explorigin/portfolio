import { isFunction, isUndefined, Null, ObjectKeys } from 'trimkit';


const VARMATCH_RE = /:([^\/]+)/g;
const ROUTEELEMENT_RE = /^[^\/]+$/;
const nop = () => 1;
const digestRoutes = (routes, baseUrl) => (
    ObjectKeys(routes).map(name => {
        const route = routes[name];
        const reg = route.path.replace(VARMATCH_RE, (m, varName) => {
            const varDef = route.vars || {};
            const regExStr = '' + (varDef[varName] || /[^\/]+/);
            return '(' + regExStr.substring(1, regExStr.lastIndexOf('/')) + ')';
        });

        return {
            matcher: new RegExp(`^${baseUrl}${reg}$`),
            name,
            ...route,
        };
    })
);

export function Router(baseUrl, routes, unmatched) {
    let listening = false;
    let currentRoute = Null;
    let reEnterHook = Null;

    let routeMatcher = digestRoutes(routes, baseUrl);

    function goto(urlOrName, vars) {
        const url = urlOrName.startsWith(baseUrl) ? urlOrName : href(urlOrName, vars);

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
                    // We're abusing RegExp.replace here.
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
            };
            if (currentRoute && currentRoute.name === newRoute.name && isFunction(reEnterHook)) {
                reEnterHook(newRoute);
                currentRoute = newRoute;
            } else {
                let onexit = (currentRoute && currentRoute.name)
                    ? routes[currentRoute.name].onexit || nop
                    : nop;
                return Promise.resolve(onexit(api, currentRoute, newRoute)).catch(()=>{
                }).then(() => {
                    reEnterHook = routes[routeMatch.name].onenter(api, newRoute);
                    currentRoute = newRoute;
                });
            }
        } else if (unmatched) {
            unmatched(api, url, currentRoute);
        } else {
            if (currentRoute && listening) {
                location.hash = currentRoute.path;
                return;
            }
            throw new Error(`No route for "${url}"`);
        }
    };

    function href(routeName, vars) {
        const route = routes[routeName];
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

                throw new Error(`Invalid value for route ${path} var ${varName}: ${value}.`);
            });
        }
        return `${baseUrl}${path}`;
    };

    function _location() {
        return location.hash;
    };

    function _handler() { goto(_location()); }

    function start(initialRoute) {
        if (listening) {
            return;
        }

        self.addEventListener('hashchange', _handler, false);
        listening = true;
        goto(_location() || initialRoute);
    };

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
        current,
    };

    return api;
}
