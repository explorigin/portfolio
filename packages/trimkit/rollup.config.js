import json from 'rollup-plugin-json';


export default {
    entry: 'src/index.js',
    format: 'umd',
    moduleName: 'Trimkit',
    plugins: [ json() ],
    dest: 'dist/trimkit.js'
};
