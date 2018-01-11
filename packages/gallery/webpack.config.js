const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname, './src'),
    entry: {
        app: './app.js',
        sw: './sw.js'
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].bundle.js',
        publicPath: '/',
    },
    devServer: {
        contentBase: path.resolve(__dirname, './src'),
        headers: {
            "Service-Worker-Allowed": "/"
        }
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader"
                })
            }
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            __DEV__: true,
        }),
        new ExtractTextPlugin('app.css', { allChunks: true }),
    ],
    devtool: 'source-map',
};
