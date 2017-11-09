const { prop, computed, bundle } = require('../lib/index.js');

describe('bundle', () => {
    const methods = {
        add: (a, b) => a + b,
        square: a => a * a,
        getVal: (val) => {}
    };

    beforeEach(() => {
        spyOn(methods, 'add').and.callThrough();
        spyOn(methods, 'square').and.callThrough();
        spyOn(methods, 'getVal').and.callThrough();
    });

    it('bundles property changes together', () => {
        const a = bundle({
            a: prop(0),
            b: prop(10),
        });
        const b = computed(methods.square, [a.a]);
        const c = computed(methods.add, [a.a, a.b]);

        b.subscribe(methods.getVal);
        c.subscribe(methods.getVal);
        expect(methods.getVal).toHaveBeenCalledTimes(0);

        expect(b()).toEqual(0);
        expect(methods.getVal).toHaveBeenCalledTimes(1);
        b();
        expect(methods.getVal).toHaveBeenCalledTimes(1);
        expect(c()).toEqual(10);
        c();
        expect(methods.getVal).toHaveBeenCalledTimes(2);
        expect(methods.add).toHaveBeenCalledTimes(1);
        expect(methods.square).toHaveBeenCalledTimes(1);

        a({a: 2, b: 20});
        expect(methods.add).toHaveBeenCalledTimes(2);
        expect(methods.square).toHaveBeenCalledTimes(2);
        expect(methods.getVal).toHaveBeenCalledTimes(4);
        expect(b()).toEqual(4);
        expect(c()).toEqual(22);
        expect(methods.add).toHaveBeenCalledTimes(2);
        expect(methods.square).toHaveBeenCalledTimes(2);
        expect(methods.getVal).toHaveBeenCalledTimes(4);
    });

    it('unbundled changes are less efficient', () => {
        const a = prop(0);
        const _b = prop(10);
        const b = computed(methods.square, [a]);
        const c = computed(methods.add, [a, _b]);

        b.subscribe(methods.getVal);
        c.subscribe(methods.getVal);
        expect(methods.getVal).toHaveBeenCalledTimes(0);

        expect(b()).toEqual(0);
        expect(methods.getVal).toHaveBeenCalledTimes(1);
        b();
        expect(methods.getVal).toHaveBeenCalledTimes(1);
        expect(c()).toEqual(10);
        c();
        expect(methods.getVal).toHaveBeenCalledTimes(2);
        expect(methods.add).toHaveBeenCalledTimes(1);
        expect(methods.square).toHaveBeenCalledTimes(1);

        a(2);
        _b(20);
        expect(methods.add).toHaveBeenCalledTimes(3);
        expect(methods.square).toHaveBeenCalledTimes(2);
        expect(methods.getVal).toHaveBeenCalledTimes(5);
        expect(b()).toEqual(4);
        expect(c()).toEqual(22);
        expect(methods.add).toHaveBeenCalledTimes(3);
        expect(methods.square).toHaveBeenCalledTimes(2);
        expect(methods.getVal).toHaveBeenCalledTimes(5);
    });

    it('allows individual members to be updated', () => {
        const a = bundle({
            a: prop(0),
            b: prop(10),
        });
        const b = computed(methods.square, [a.a]);
        const c = computed(methods.add, [a.a, a.b]);

        b.subscribe(methods.getVal);
        c.subscribe(methods.getVal);
        expect(methods.getVal).toHaveBeenCalledTimes(0);

        expect(b()).toEqual(0);
        expect(methods.getVal).toHaveBeenCalledTimes(1);
        b();
        expect(methods.getVal).toHaveBeenCalledTimes(1);
        expect(c()).toEqual(10);
        c();
        expect(methods.getVal).toHaveBeenCalledTimes(2);
        expect(methods.add).toHaveBeenCalledTimes(1);
        expect(methods.square).toHaveBeenCalledTimes(1);

        a.a(2);
        a.b(20);
        expect(methods.add).toHaveBeenCalledTimes(3);
        expect(methods.square).toHaveBeenCalledTimes(2);
        expect(methods.getVal).toHaveBeenCalledTimes(5);
        expect(b()).toEqual(4);
        expect(c()).toEqual(22);
        expect(methods.add).toHaveBeenCalledTimes(3);
        expect(methods.square).toHaveBeenCalledTimes(2);
        expect(methods.getVal).toHaveBeenCalledTimes(5);
    });


});
