import { prop, computed } from '../src/index.js';
import { dirtyMock, hashSet } from '../src/testUtil.js';

describe('A computed', () => {
    const add = (a, b) => a + b;
    const square = a => a * a;

    it('returns the value computed from its dependencies', () => {
        const a = prop(0);
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
        const a = prop(0);
        const b = computed((val) => {
            runCount += 1;
            expect(val).toEqual(currentValue);
            return val * val;
        }, [a]);

        a(1);
        expect(runCount).toEqual(0);
        // b evaluates
        expect(b()).toEqual(1);
        expect(runCount).toEqual(1);
        // b does not evaluate
        expect(b()).toEqual(1);
        expect(runCount).toEqual(1);
        currentValue = 3;
        // b does not evaluate
        a(3);
        expect(runCount).toEqual(1);
        // b evaluates
        expect(b()).toEqual(9);
        expect(runCount).toEqual(2);
    });

    it('computes automatically when subscribed', () => {
        let runCount = 0;
        let subRunCount = 0;
        let currentValue = 1;
        const a = prop(0);
        const b = computed((val) => {
            runCount += 1;
            expect(val).toEqual(currentValue);
            return val * val;
        }, [a]);

        // b does not evaluate
        a(1);
        expect(runCount).toEqual(0);
        // b evaluates
        expect(b()).toEqual(1);
        expect(runCount).toEqual(1);
        // b does not evaluate
        expect(b()).toEqual(1);
        expect(runCount).toEqual(1);

        const cancelSubscription = b.subscribe((val) => {
            subRunCount += 1;
            expect(val).toEqual(currentValue*currentValue);
        })

        currentValue = 3;
        // b evaluates
        a(3);
        expect(runCount).toEqual(2);
        expect(subRunCount).toEqual(1);
        // b does not evaluate
        expect(b()).toEqual(9);
        expect(runCount).toEqual(2);
        expect(subRunCount).toEqual(1);
    });

    it('honors cancelled subscriptions', () => {
        let runCount = 0;
        let subRunCount = 0;
        let currentValue = 1;
        const a = prop(0);
        const b = computed((val) => {
            runCount += 1;
            expect(val).toEqual(currentValue);
            return val * val;
        }, [a]);
        const cancelSubscription = b.subscribe((val) => {
            subRunCount += 1;
            expect(val).toEqual(currentValue*currentValue);
        })

        const cancelSubscription2 = b.subscribe((val) => {
            subRunCount += 1;
        });

        // b evaluates
        a(1);
        expect(runCount).toEqual(1);
        expect(subRunCount).toEqual(2);
        // b does not evaluate
        expect(b()).toEqual(1);
        expect(runCount).toEqual(1);
        expect(subRunCount).toEqual(2);

        expect(cancelSubscription()).toEqual(1);

        currentValue = 3;
        // b evaluates
        a(3);
        expect(runCount).toEqual(2);
        expect(subRunCount).toEqual(3);
        // b does not evaluate
        expect(b()).toEqual(9);
        expect(runCount).toEqual(2);
        expect(subRunCount).toEqual(3);

        expect(cancelSubscription2()).toEqual(0);
    });

    it('can be detached', () => {
        const a = prop(2);
        const b = computed(square, [a]);
        const c = computed(add, [a, b]);

        expect(b()).toEqual(4);
        expect(c()).toEqual(6);

        b.detach();

        a(3);
        expect(b()).toEqual(4);
        expect(c()).toEqual(7);
    });

    it('uses a comparator', () => {
        let runCount = 0;

        function intersection(a, b) {
            runCount += 1;
            return new Set([...a].filter(x => b.has(x)));
        }

        const a = prop(new Set([1, 2]), hashSet);
        const b = prop(new Set([2, 3]), hashSet);
        const ABintersection = computed(intersection, [a, b], hashSet);

        expect(runCount).toEqual(0);
        expect([...ABintersection()]).toEqual([2]);
        expect(runCount).toEqual(1);
        b(new Set([3, 2]));
        expect([...ABintersection()]).toEqual([2]);
        expect(runCount).toEqual(1);
        b(new Set([3, 2, 1]));
        expect(runCount).toEqual(1);
        expect([...ABintersection()]).toEqual([1, 2]);
        expect(runCount).toEqual(2);
    });

    it('flags all subscribers as dirty before propagating change', () => {
        function intersection(a, b) {
            return new Set([...a].filter(x => b.has(x)));
        }

        const a = prop(new Set([1, 2]), hashSet);
        const b = prop(new Set([2, 3]), hashSet);
        const ABintersection = computed(intersection, [a, b], hashSet);

        const [dirtyA, dirtyB, checker] = dirtyMock(2);

        ABintersection.subscribe(dirtyA.setDirty);
        ABintersection.subscribe(dirtyB.setDirty);

        a(new Set([3, 4]));

        expect(checker()).toBe(true);
    });

    it('calls subscriptions in order', () => {
        let order = '';

        const a = prop(null);
        const b = computed(a => a, [a]);
        b.subscribe(() => order += 'a');
        b.subscribe(() => order += 'b');
        b.subscribe(() => order += 'c');
        a(1);
        expect(order).toEqual('abc');
    });
});
