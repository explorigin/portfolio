const { observable } = require('../lib/index.js');

describe('observable', () => {
    it('returns its initialized value', () => {
        const a = observable(true);
        expect(a()).toEqual(true);
    });

    it('returns its set value', () => {
        const a = observable();
        expect(a()).toEqual(undefined);
        expect(a(true)).toEqual(true);
    });

    it('returns notifies dependents of updates', () => {
        let runCount = 0;
        let currentValue = 1;
        const a = observable();
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
        const a = observable();
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


    it('uses a comparator', () => {
        function setEquals(a, b) {
            return (
                a instanceof Set
                && b instanceof Set
                && [...a].reduce((acc, d) => acc && b.has(d), true)
                && [...b].reduce((acc, d) => acc && a.has(d), true)
            );
        }

        let runCount = 0

        const a = observable(new Set([1, 2]), setEquals);
        a.subscribe(() => runCount += 1);
        expect([...a()]).toEqual([1, 2]);
        expect(runCount).toEqual(0);
        expect([...a(new Set([2, 1]))]).toEqual([1, 2]);
        expect(runCount).toEqual(0);
        expect([...a(new Set([3, 2, 1]))]).toEqual([3, 2, 1]);
        expect(runCount).toEqual(1);
    });
});
