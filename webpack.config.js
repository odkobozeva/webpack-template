const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

const filename = (ext) => isDev ? `[name].${ext}` : `[name].[contenthash].${ext}`;

const optimization = () => {
    configObj = {
        splitChunks: {
            chunks: 'all'
        }
    };

    if (isProd) {
        configObj.minimizer = [
            new CssMinimizerPlugin(),
            new TerserPlugin()
        ]
    }
    return configObj;
};

const plugins = () => {
    const basePlugins = [
        new HTMLWebpackPlugin({
            template: path.resolve(__dirname, 'src/index.html'),
            filename: 'index.html',
            minify: {
                collapseWhitespace: isProd
            }
        }),
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: `./css/${filename('css')}`,
        }),
        new CopyWebpackPlugin({
            patterns: [{
                from: path.resolve(__dirname, 'src/assets'),
                to: path.resolve(__dirname, 'app')
            }]
        })
    ];

    if (isProd) {
        basePlugins.push(
            new ImageMinimizerPlugin({
                minimizerOptions: {
                    // Lossless optimization with custom option
                    // Feel free to experiment with options for better result for you
                    plugins: [
                        ['gifsicle', {
                            interlaced: true
                        }],
                        ['jpegtran', {
                            progressive: true
                        }],
                        ['optipng', {
                            optimizationLevel: 5
                        }],
                        [
                            'svgo',
                            {
                                plugins: [{
                                    removeViewBox: false,
                                }, ],
                            },
                        ],
                    ],
                },
            }),
        )
    }

    return basePlugins;
};

module.exports = {
    context: path.resolve(__dirname, 'src'),
    mode: 'development',
    entry: './js/main.js',
    output: {
        filename: `./js/${filename('js')}`,
        path: path.resolve(__dirname, 'app'),
        publicPath: ''
    },
    devServer: {
        historyApiFallback: true,
        static: path.resolve(__dirname, 'app'),
        open: true,
        compress: true,
        hot: true,
        port: 3000,
    },
    optimization: optimization(),
    plugins: plugins(),
    devtool: isProd ? false : 'source-map',
    module: {
        rules: [
            {
                test: /\.html$/,
                loader: 'html-loader'
            },
            {
                test: /\.css$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: isDev
                        }
                    },
                    'css-loader'
                ]
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    {
                      loader: MiniCssExtractPlugin.loader,
                      options: {
                        publicPath: (resourcePath, context) => {
                          return path.relative(path.dirname(resourcePath), context) + '/';
                        },
                      }
                    },
                    'css-loader',
                    'sass-loader'
                  ],
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /\.(?:|gif|png|jpg|jpeg|svg)$/i,
                type: 'asset/resource',
                generator: {
                   filename: 'img/[name][ext]'
                 }
            },
            {
                test: /\.(?:|woff2|woff)$/,
                type: 'asset/resource',
                generator: {
                filename: 'fonts/[name][ext]'
                }
            },
        ]
    }
}
