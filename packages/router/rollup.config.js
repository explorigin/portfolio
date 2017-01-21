import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';

const babelConfig = {
    env: {
        es6: true,
        browser: true
    },
    plugins: [],
    presets: [
        'stage-0',
        'es2015-rollup'
    ]
};

export default {
    entry: 'src/index.js',
    format: 'umd',
    moduleName: 'Router',
    plugins: [ json(), babel(babelConfig) ],
    dest: 'dist/router.js'
};
