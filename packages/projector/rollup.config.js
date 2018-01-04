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
    moduleName: 'Projector',
    plugins: [ json(), babel(babelConfig) ],
    output: {
        format: 'umd',
        file: 'dist/projector.js'
    }
};
