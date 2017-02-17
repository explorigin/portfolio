const { CreateDocument } = require('../lib/document.js');

describe('Document', () => {
    let doc;
    const changes = [];

    beforeEach(() => {
        doc = new CreateDocument(change => changes.push(change));
        changes.splice(0, changes.length);
    });

    describe('element insertion', () => {
        it('to do nothing on creation', () => {
            const el = doc.createElement('div');
            expect(changes).toEqual([]);
        });

        it('to produce a patch upon append', () => {
            const el = doc.createElement('div');
            expect(changes).toEqual([]);
            doc.body.appendChild(el);
            expect(changes).toEqual([[0, doc.body._id, {
                t: 1,
                n: 'DIV',
                p: [],
                i: doc.body._id + 1,
                c: []
            }, undefined]]);
        });

        it('to produce a patch upon append with a full tree', () => {
            const el1 = doc.createElement('div');
            const el2 = doc.createElement('span');
            expect(changes).toEqual([]);
            el1.appendChild(el2);
            expect(changes).toEqual([]);
            doc.body.appendChild(el1)
            expect(changes).toEqual([[0, doc.body._id, {
                t: 1,
                n: 'DIV',
                p: [],
                i: doc.body._id + 1,
                c: [{
                    t: 1,
                    n: 'SPAN',
                    p: [],
                    i: doc.body._id + 2,
                    c: []
                }]
            }, undefined]]);
            expect(changes.length).toEqual(1);
        });

        it('to produce a patch upon insert', () => {
            const el1 = doc.createElement('div');
            const el2 = doc.createElement('span');
            expect(changes).toEqual([]);
            doc.body.appendChild(el1);
            expect(changes).toEqual([[0, doc.body._id, {
                t: 1,
                n: 'DIV',
                p: [],
                i: doc.body._id + 1,
                c: []
            }, undefined]]);
            doc.body.insertBefore(el2, el1);
            expect(changes.length).toEqual(2);
            expect(changes[1]).toEqual([0, doc.body._id, {
                t: 1,
                n: 'SPAN',
                p: [],
                i: doc.body._id + 2,
                c: []
            }, doc.body._id + 1]);
        });
    });

    describe('element removal', () => {
        it('to propagate no changes after removal', () => {
            const el1 = doc.createElement('div');
            const el2 = doc.createElement('span');
            expect(changes).toEqual([]);
            el1.appendChild(el2);
            expect(changes).toEqual([]);
            doc.body.appendChild(el1)
            expect(changes).toEqual([[0, doc.body._id, {
                t: 1,
                n: 'DIV',
                p: [],
                i: doc.body._id + 1,
                c: [{
                    t: 1,
                    n: 'SPAN',
                    p: [],
                    i: doc.body._id + 2,
                    c: []
                }]
            }, undefined]]);
            expect(changes.length).toEqual(1);
            doc.body.removeChild(el1);
            expect(changes.length).toEqual(2);
            expect(changes[1]).toEqual([2, doc.body._id + 1]);
            el1.removeChild(el2);
            expect(changes.length).toEqual(2);
        });
    });

    describe('element attribute changes', () => {
        it('to propagate when attached', () => {
            const el1 = doc.createElement('div');
            const el2 = doc.createElement('span');
            el1.setAttribute('class', '1');
            expect(changes).toEqual([]);
            el1.appendChild(el2);
            expect(changes).toEqual([]);
            doc.body.appendChild(el1)
            expect(changes).toEqual([[0, doc.body._id, {
                t: 1,
                n: 'DIV',
                p: [{ ns: null, name: 'class', value: '1' }],
                i: doc.body._id + 1,
                c: [{
                    t: 1,
                    n: 'SPAN',
                    p: [],
                    i: doc.body._id + 2,
                    c: []
                }]
            }, undefined]]);
            expect(changes.length).toEqual(1);
            el2.setAttribute('class', '2');
            expect(changes.length).toEqual(2);
            expect(changes[1]).toEqual([1, doc.body._id + 2, { ns: null, name: 'class', value: '2' }]);
            el2.removeAttribute('class');
            expect(changes.length).toEqual(3);
            expect(changes[2]).toEqual([1, doc.body._id + 2, { name: 'class', value: null }]);
        });
    });
});
