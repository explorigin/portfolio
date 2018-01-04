import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';

const babelConfig = {
    env: {
        es6: true,
        browser: true
    },
    plugins: [
    ],
    presets: [
        'es2015-rollup'
    ]
};

export default {
    entry: 'src/index.js',
    moduleName: 'WorkerPortal',
    plugins: [ json(), babel(babelConfig) ],
    output: {
        format: 'umd',
        file: 'dist/worker-portal.js'
    }
};
