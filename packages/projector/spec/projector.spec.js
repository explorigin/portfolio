// const { Projector } = require('../lib/index.js');

let COUNTER = 0;

describe('Projector', () => {
    let projector;
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        container.className = 'testContainer';
        document.body.appendChild(container);

        projector = Projector.Projector(container);
    });

    afterEach(() => {
        container.parentNode.removeChild(container);
        container = null;
    });

    function add(data, parentId = null, before) {
        projector.queueFrame([
            [0, parentId, data, before]
        ]);
        return data.i;
    }

    function patch(id, props) {
        projector.queueFrame([
            [1, id, props]
        ]);
    }

    function remove(id) {
        projector.queueFrame([
            [2, id]
        ]);
    }


    function h(tagName, props, children = []) {
        return {
            t: 1,
            n: tagName,
            p: props,
            c: children,
            i: COUNTER++
        };
    }

    function waitForNextFrame() {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                setTimeout(resolve, 1);
            }, container);
        });
    }

    describe('getElement', () => {
        it('getElement(null) method should to return the container.', () => {
            expect(projector.getElement(null)).toBe(container);
        });

        it('getElement(id) method should to return the patched node.', () => {
            const id = add(h('div', { className: 'first' }));
            expect(projector.getElement(id)._id).toBe(id);
        });
    });

    describe('queueFrame', () => {
        describe('patch to add elements', () => {
            it('patch to add a basic element with a class', () => {
                expect(container.childNodes.length).toBe(0);

                const id = add(h('div', { className: 'first' }));

                expect(container.childNodes.length).toBe(1);
                const newEl = document.querySelector('.first');
                expect(newEl._id).toBe(id);
                expect(newEl.parentNode).toBe(container);
                expect(newEl.className).toBe('first');
            });

            it('patch to add a text element', () => {
                expect(container.childNodes.length).toBe(0);

                const id = add({
                    t: 3,
                    n: '',
                    p: { textContent: 'howdy'},
                    c: [],
                    i: COUNTER++
                });

                expect(container.childNodes.length).toBe(1);
                const newEl = container.childNodes[0];
                expect(newEl._id).toBe(id);
                expect(newEl.parentNode).toBe(container);
                expect(newEl.textContent).toBe('howdy');
            });

            it('patch to add a sibling element with a class', (done) => {
                const id = add(h('div', { className: 'first' }));
                waitForNextFrame().then(() => {
                    const siblingId = add(h('div', { className: 'second' }), null, id);

                    expect(container.childNodes.length).toBe(2);
                    const el = document.querySelector('.second');
                    expect(el._id).toBe(siblingId);
                    expect(el.parentNode).toBe(container);
                    expect(el.nextSibling._id).toBe(id);
                }).then(done).catch(console.error.bind(console));
            });

            it('patch to add a tree of elements', () => {
                const id = add(h('div', {}, [
                    h('span', { className: 'child' })
                ]));
                const parent = projector.getElement(id);
                expect(container.childNodes.length).toBe(1);
                const child = parent.childNodes[0];
                expect(document.querySelector('.child')).toBe(child);
                expect(projector.getElement(child._id)).toBe(child);
            });
        });

        describe('patch to update elements', () => {
            it('patch to change a class', (done) => {
                const id = add(h('div', { className: 'first' }));
                waitForNextFrame().then(() => {
                    patch(id, { className: 'second' });

                    expect(container.childNodes.length).toBe(1);
                    const el = document.querySelector('.second');
                    expect(el._id).toBe(id);
                    expect(el.parentNode).toBe(container);
                    expect(el.className).toBe('second');
                }).then(done).catch(console.error.bind(console));
            });

            it('patch to update text', (done) => {
                expect(container.childNodes.length).toBe(0);

                const id = add({
                    t: 3,
                    n: '',
                    p: { textContent: 'howdy'},
                    c: [],
                    i: COUNTER++
                });

                expect(container.childNodes.length).toBe(1);
                const newEl = container.childNodes[0];
                expect(newEl._id).toBe(id);
                expect(newEl.parentNode).toBe(container);
                expect(newEl.textContent).toBe('howdy');
                waitForNextFrame().then(() => {
                    patch(id, { textContent: 'pardner' });

                    expect(newEl.textContent).toBe('pardner');
                }).then(done).catch(console.error.bind(console));
            });
        });

        describe('patch to remove an element', () => {
            it('', (done) => {
                const id = add(h('div', {}, [
                    h('span', { className: 'child' })
                ]));
                const parent = projector.getElement(id);
                const child = parent.childNodes[0];
                expect(projector.getElement(child._id)).toBe(child);
                remove(child._id);
                waitForNextFrame().then(() => {
                    expect(parent.childNodes.length).toBe(0);
                    expect(child.parentNode).toBe(null);
                    expect(projector.getElement(child._id)).toBe(undefined);
                }).then(done).catch(console.error.bind(console));
            });
        });
    });
});
