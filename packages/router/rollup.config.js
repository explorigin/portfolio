import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';

export default {
    entry: 'src/index.js',
    format: 'umd',
    moduleName: 'Router',
    plugins: [ json(), babel(babelConfig) ],
    dest: 'dist/router.js'
};
