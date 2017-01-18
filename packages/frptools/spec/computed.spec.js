const { observable, computed } = require('../lib/index.js');

describe('computed', () => {
    const add = (a, b) => a + b;
    const square = a => a * a;

    it('returns the value computed from its dependencies', () => {
        const a = observable(0);
        const b = computed(square, [a]);
        const c = computed(add, [a, b]);

        expect(b()).toEqual(0);
        expect(c()).toEqual(0);

        a(1);
        expect(b()).toEqual(1);
        expect(c()).toEqual(2);

        a(2);
        expect(b()).toEqual(4);
        expect(c()).toEqual(6);

        a(3);
        expect(b()).toEqual(9);
        expect(c()).toEqual(12);
    });

    it('only computes when called', () => {
        let runCount = 0;
        let currentValue = 1;
        const a = observable(0);
        const b = computed((val) => {
            runCount += 1;
            expect(val).toEqual(currentValue);
            return val * val;
        }, [a]);

        a(1);
        expect(runCount).toEqual(0);
        expect(b()).toEqual(1);
        expect(runCount).toEqual(1);
        expect(b()).toEqual(1);
        expect(runCount).toEqual(1);
        currentValue = 3;
        a(3);
        expect(runCount).toEqual(1);
        expect(b()).toEqual(9);
        expect(runCount).toEqual(2);
    });

    it('can be detached', () => {
        const a = observable(2);
        const b = computed(square, [a]);
        const c = computed(add, [a, b]);

        expect(b()).toEqual(4);
        expect(c()).toEqual(6);

        b.detach();

        a(3);
        expect(b()).toEqual(4);
        expect(c()).toEqual(7);
    });
});
