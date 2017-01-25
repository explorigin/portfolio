const { WorkerPortal } = require('../lib/index.js');

function FakeWorkerPair() {
    let cbA = null;
    let cbB = null;

    const objA = {
        postMessage: (data) => {
            cbB({ data: data });
        },
        addEventListener: (eventName, fn) => {
            cbA = (...r) => { fn(...r); };
        },
        removeEventListener: (eventName, fn) => {
            cbA = null;
        }
    };

    const objB = {
        postMessage: (data) => {
            cbA({ data: data });
        },
        addEventListener: (eventName, fn) => {
            cbB = (...r) => { fn(...r); };
        },
        removeEventListener: (eventName, fn) => {
            cbB = null;
        }
    };

    return [objA, objB];
}

describe('Workers ', () => {
    it('can call and respond equally', done => {
        const [a, b] = FakeWorkerPair();
        let masterApi, slaveApi;

        return Promise.all([
            WorkerPortal(
                {
                    slaveAdd: (a, b) => (a + b),
                    math: {
                        multiply: (a, b) => (a * b),
                        lib: {
                            pow: (a, b) => Math.pow(a, b),
                        }
                    }
                },
                a,
                true
            ),
            WorkerPortal(
                {
                    masterSubtract: (a, b) => (a - b)
                },
                b,
                false
            )
        ])
        .then(([slave, master]) => {
            masterApi = master;
            slaveApi = slave;

            expect(Object.keys(masterApi)).toEqual(['__init', '__cleanupSlave', 'slaveAdd', 'math', '_cleanup']);
            expect(Object.keys(masterApi.math)).toEqual(['multiply', 'lib']);
            expect(Object.keys(slaveApi)).toEqual(['masterSubtract']);

            return Promise.all([
                slaveApi.masterSubtract(9, 2),
                masterApi.slaveAdd(9, 2),
                masterApi.math.multiply(9, 2),
                masterApi.math.lib.pow(9, 2)
            ]);
        })
        .then(results => {
            expect(results).toEqual([7, 11, 18, 81]);

            return Promise.all([
                masterApi.slaveAdd(5, 2),
                slaveApi.masterSubtract(2, 2),
            ]);
        })
        .then(results => {
            expect(results).toEqual([7, 0]);
            return masterApi._cleanup();
        })
        .catch((e) => {
            fail(e);
        })
        .then(() => {
            return masterApi.slaveAdd(9, 2);
        })
        .then(e => {
            fail('Expected rejection');
        })
        .catch(e => {
            expect(e.message).toBe('Portal disabled');
            done();
        });
    });
});
