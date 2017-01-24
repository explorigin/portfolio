const { Router } = require('../lib/index.js');


describe('router.href builds urls', () => {
    const router = Router([
        {
            name: 'home',
            path: '/',
            enter: (route, router) => {},
            exit: (route, newRoute, router) => {}
        },
        {
            name: 'article',
            path: '/article/:id',
            vars: {id: /[a-f0-9]{6,40}/},
            enter: (route, router) => {},
            exit: (route, newRoute, router) => {}
        },
    ]);

    it('at the root', () => {
        expect(router.href('home')).toEqual('#/');
    });

    it('with variables', () => {
        expect(router.href('article', {id: 156234})).toEqual('#/article/156234');
    });

    describe('but throws an error', () => {
        it("if the route doesn't exist", () => {
            expect(() => {
                router.href('artcle', {id: 156});
            }).toThrowError(Error, "Invalid route artcle.");
        });

        it("if the vars don't match", () => {
            expect(() => {
                router.href('article', {id: 156});
            }).toThrowError(Error, "Invalid value for route /article/:id var id: 156.");
        });
    });
});

describe('router.goto()', () => {
    let reEnterHooks, routeSpecArray, router;

    describe('goes to routes', () => {
        beforeEach(() => {
            reEnterHooks = {
                home: () => {},
                article: () => {}
            };
            routeSpecArray = [
                {
                    name: 'home',
                    path: '/',
                    enter: (route, router) => ( reEnterHooks.home ),
                    exit: (route, newRoute, router) => {}
                },
                {
                    name: 'article',
                    path: '/article/:id',
                    vars: {id: /[a-f0-9]{6,40}/},
                    enter: (route, router) => ( reEnterHooks.article ),
                    exit: (route, newRoute, router) => {}
                },
            ];

            spyOn(routeSpecArray[0], 'enter').and.callThrough();
            spyOn(routeSpecArray[1], 'enter').and.callThrough();

            router = Router(routeSpecArray);
        });

        it('with vars', (done) => {
            router.goto('article', {id: 156234}).then(() => {
                expect(routeSpecArray[1].enter).toHaveBeenCalled();
                const current = router.current();
                expect(current.name).toEqual('article');
                expect(current.path).toEqual('#/article/156234');
                done();
            });
        });
        it('at the root', (done) => {
            router.goto('home').then(() => {
                expect(routeSpecArray[0].enter).toHaveBeenCalled();
                const current = router.current();
                expect(current.name).toEqual('home');
                expect(current.path).toEqual('#/');
                done();
            });
        });
        it('with a url', (done) => {
            router.goto('#/article/156233').then(() => {
                expect(routeSpecArray[1].enter).toHaveBeenCalled();
                const current = router.current();
                expect(current.name).toEqual('article');
                expect(current.path).toEqual('#/article/156233');
                done();
            });
        });
    });

    describe('reEnters routes', () => {
        it('when a route is navigated with merely different vars with a reenter hook', (done) => {
            reEnterHooks = {
                home: () => {},
                article: () => {}
            };
            routeSpecArray = [
                {
                    name: 'home',
                    path: '/',
                    enter: (route, router) => ( reEnterHooks.home ),
                    exit: (route, newRoute, router) => {}
                },
                {
                    name: 'article',
                    path: '/article/:id',
                    vars: {id: /[a-f0-9]{6,40}/},
                    enter: (route, router) => ( reEnterHooks.article ),
                    exit: (route, newRoute, router) => {}
                },
            ];

            spyOn(routeSpecArray[0], 'enter').and.callThrough();
            spyOn(routeSpecArray[1], 'enter').and.callThrough();
            spyOn(routeSpecArray[1], 'exit').and.callThrough();
            spyOn(reEnterHooks, 'article').and.callThrough();

            router = Router(routeSpecArray);

            router.goto('article', {id: 156234})
            .then(() => {
                expect(routeSpecArray[1].enter).toHaveBeenCalled();
                expect(routeSpecArray[1].exit).toHaveBeenCalledTimes(0);
                return router.goto('article', {id: 151234});
            })
            .then(() => {
                expect(reEnterHooks.article).toHaveBeenCalled();
                expect(routeSpecArray[1].exit).toHaveBeenCalledTimes(0);
                return router.goto('home');
            })
            .then(() => {
                expect(routeSpecArray[0].enter).toHaveBeenCalled();
                expect(routeSpecArray[1].exit).toHaveBeenCalled();
            })
            .then(done);
        })

        it('when a route is navigated with merely different vars without a reenter hook', (done) => {
            routeSpecArray = [
                {
                    name: 'home',
                    path: '/',
                    enter: (route, router) => {},
                    exit: (route, newRoute, router) => {}
                },
                {
                    name: 'article',
                    path: '/article/:id',
                    vars: {id: /[a-f0-9]{6,40}/},
                    enter: (route, router) => {},
                    exit: (route, newRoute, router) => {}
                },
            ];

            spyOn(routeSpecArray[0], 'enter').and.callThrough();
            spyOn(routeSpecArray[1], 'enter').and.callThrough();
            spyOn(routeSpecArray[1], 'exit').and.callThrough();

            router = Router(routeSpecArray);

            router.goto('article', {id: 156234})
            .then(() => {
                expect(routeSpecArray[1].enter).toHaveBeenCalled();
                expect(routeSpecArray[1].exit).toHaveBeenCalledTimes(0);
                return router.goto('article', {id: 151234});
            })
            .then(() => {
                expect(routeSpecArray[1].enter).toHaveBeenCalledTimes(2);
                expect(routeSpecArray[1].exit).toHaveBeenCalledTimes(1);
                return router.goto('home');
            })
            .then(() => {
                expect(routeSpecArray[0].enter).toHaveBeenCalled();
                expect(routeSpecArray[1].exit).toHaveBeenCalled();
            })
            .then(done);
        })
    });
});
