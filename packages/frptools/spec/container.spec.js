import { container, computed } from '../src/index.js';
import { dirtyMock, hashSet } from '../src/testUtil.js';

describe('A container', () => {
    it('notifies dependents of updates', () => {
        let runCount = 0;
        let currentValue = new Set();
        const a = container(new Set(), hashSet);
        const b = computed(s => Array.from(s).reduce((i, acc) => i + acc, 0), [a])
        a.subscribe(val => {
            runCount += 1;
            expect(hashSet(a)).toEqual(hashSet(currentValue));
        });
        currentValue.add(1)
        a.add(1);
        expect(runCount).toEqual(1);
        expect(b()).toEqual(1);
        currentValue.add(2)
        a.add(2);
        expect(runCount).toEqual(2);
        expect(b()).toEqual(3);
    });

    it('works for arrays', () => {
        let runCount = 0;
        let currentValue = [];
        const a = container([], arr => arr.join('x'));
        a.subscribe(val => {
            runCount += 1;
            expect(a.join('x')).toEqual(currentValue.join('x'));
        });
        currentValue.push(1)
        a.push(1);
        expect(runCount).toEqual(1);
        currentValue.push(2)
        a.push(2);
        expect(runCount).toEqual(2);
        currentValue.push(3)
        a._.push(3);
        expect(runCount).toEqual(2);
    });

    it('._ returns the proxied element', () => {
        let runCount = 0;
        let currentValue = new Set();
        const a = container(new Set(), hashSet);
        a.subscribe(val => {
            runCount += 1;
            expect(hashSet(a)).toEqual(hashSet(currentValue));
        });
        currentValue.add(1)
        a.add(1);
        expect(runCount).toEqual(1);
        currentValue.add(2)
        a.add(2);
        expect(runCount).toEqual(2);
        currentValue.add(3)
        a._.add(3);
        expect(runCount).toEqual(2);
    });

    it('flags all subscribers as dirty before propagating change', () => {
        const a = container(new Set(), hashSet);

        const [dirtyA, dirtyB, checker] = dirtyMock(2);

        a.subscribe(dirtyA.setDirty);
        a.subscribe(dirtyB.setDirty);

        a.add(1);

        expect(checker()).toBe(true);
    });

    it('calls subscriptions in order', () => {
        let order = '';

        const a = container(new Set(), hashSet);
        a.subscribe(() => order += 'a');
        a.subscribe(() => order += 'b');
        a.subscribe(() => order += 'c');
        a.add(1);
        expect(order).toEqual('abc');
    });
});
