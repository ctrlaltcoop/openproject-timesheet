const webpack = require('webpack');

module.exports = {
    outputDir: '../app/assets/javascripts/timesheet',
    baseUrl: '/assets/timesheet/',
    filenameHashing: false,
    devServer: {
        disableHostCheck: true
    },
    configureWebpack: {
        devtool: false,
        plugins: [
            // Ignore all locale files of moment.js
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        ],
    },
    chainWebpack: (config) => {
        config.optimization.delete('splitChunks')
    }
};