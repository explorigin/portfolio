const { prop } = require('../lib/index.js');
const { dirtyMock, hashSet } = require('../lib/testUtil.js');

describe('A property', () => {
    it('returns its initialized value', () => {
        const a = prop(true);
        expect(a()).toEqual(true);
    });

    it('returns its set value', () => {
        const a = prop();
        expect(a()).toEqual(undefined);
        expect(a(true)).toEqual(true);
    });

    it('returns notifies dependents of updates', () => {
        let runCount = 0;
        let currentValue = 1;
        const a = prop();
        a.subscribe(val => {
            runCount += 1;
            expect(val).toEqual(currentValue);
        })
        expect(a(1)).toEqual(1);
        expect(runCount).toEqual(1);
        expect(a(1)).toEqual(1);
        expect(runCount).toEqual(1);
        currentValue = 2;
        expect(a(2)).toEqual(2);
        expect(runCount).toEqual(2);
        expect(a(2)).toEqual(2);
        expect(runCount).toEqual(2);
        currentValue = 1;
        expect(a(1)).toEqual(1);
        expect(runCount).toEqual(3);
        expect(a(1)).toEqual(1);
        expect(runCount).toEqual(3);
    });

    it('honors cancelled subscriptions', () => {
        let runCount = 0;
        let currentValue = 1;
        const a = prop();
        const cancelSubscription = a.subscribe(val => {
            runCount += 1;
            expect(val).toEqual(currentValue);
        });
        const cancelSubscription2 = a.subscribe(val => {
            runCount += 1;
            expect(val).toEqual(currentValue);
        });
        expect(a(1)).toEqual(1);
        expect(runCount).toEqual(2);
        expect(a(1)).toEqual(1);
        expect(runCount).toEqual(2);
        expect(cancelSubscription()).toEqual(1);
        currentValue = 3;
        expect(a(3)).toEqual(3);
        expect(runCount).toEqual(3);
        expect(cancelSubscription2()).toEqual(0);
        currentValue = 4;
        expect(a(4)).toEqual(4);
        expect(runCount).toEqual(3);
    });

    it('uses a hash function', () => {
        let runCount = 0;

        const a = prop(new Set([1, 2]), hashSet);
        a.subscribe(() => runCount += 1);
        expect([...a()]).toEqual([1, 2]);
        expect(runCount).toEqual(0);
        expect([...a(new Set([2, 1]))]).toEqual([1, 2]);
        expect(runCount).toEqual(0);
        expect([...a(new Set([3, 2, 1]))]).toEqual([3, 2, 1]);
        expect(runCount).toEqual(1);
    });

    it('flags all subscribers as dirty before propagating change', () => {
        const a = prop(true);

        const [dirtyA, dirtyB, checker] = dirtyMock(2);

        a.subscribe(dirtyA.setDirty);
        a.subscribe(dirtyB.setDirty);

        a(false);

        expect(checker()).toBe(true);
    });

    it('calls subscriptions in order', () => {
        let order = '';

        const a = prop(0);
        a.subscribe(() => order += 'a');
        a.subscribe(() => order += 'b');
        a.subscribe(() => order += 'c');
        a(1);
        expect(order).toEqual('abc');
    });
});
