import json from 'rollup-plugin-json';


export default {
    entry: 'src/index.js',
    moduleName: 'Trimkit',
    plugins: [ json() ],
    output: {
        format: 'umd',
        file: 'dist/trimkit.js'
    }
};
