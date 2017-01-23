const { Router } = require('../lib/index.js');

describe('router builds urls', () => {
    describe('for hashed routes', () => {
        const router = Router(
            '#',
            {
                'home': {
                    path: '/',
                    onenter: (r, route) => {},
                    onexit: (r, route, newRoute) => {}
                },
                'article': {
                    path: '/article/:id',
                    vars: {id: /[a-f0-9]{6,40}/},
                    onenter: (r, route) => {},
                    onexit: (r, route, newRoute) => {}
                },
            },
            (r, path, lastGoodRoute) => {}
        );

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
});


describe('router goes to routes', () => {
    describe('for hashed routes', () => {
        const router = Router(
            '#',
            {
                'home': {
                    path: '/',
                    onenter: (r, route) => {},
                    onexit: (r, route, newRoute) => {}
                },
                'article': {
                    path: '/article/:id',
                    vars: {id: /[a-f0-9]{6,40}/},
                    onenter: (r, route) => {},
                    onexit: (r, route, newRoute) => {}
                }
            },
            (r, path, lastGoodRoute) => {}
        );
        it('at the root', (done) => {
            router.goto('home').then(() => {
                const current = router.current();
                expect(current.name).toEqual('home');
                expect(current.path).toEqual('#/');
                done();
            });
        });
        it('with vars', (done) => {
            router.goto('article', {id: 156234}).then(() => {
                const current = router.current();
                expect(current.name).toEqual('article');
                expect(current.path).toEqual('#/article/156234');
                done();
            });
        });
        it('with a url', (done) => {
            router.goto('#/article/156233').then(() => {
                const current = router.current();
                expect(current.name).toEqual('article');
                expect(current.path).toEqual('#/article/156233');
                done();
            });
        });
    });
});
