var webpack = require('webpack');
var ENABLE_SOURCEMAPS = process.env.ENABLE_SOURCEMAPS || false;

module.exports = function(config) {
  var customLaunchers = {
    'SL_Chrome_26': {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: '26'
    },
    'SL_Chrome_dev': {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: 'dev'
    },
    'SL_Firefox_10': {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '10'
    },
    'SL_Firefox_beta': {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: 'beta'
    },
    'SL_Safari_9': {
      base: 'SauceLabs',
      browserName: 'safari',
      version: '9'
    },
    'SL_Safari_10': {
      base: 'SauceLabs',
      browserName: 'safari',
      version: '10'
    },
    'SL_IE_11': {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 10',
      version: '11'
    }
  }

  config.set({
    sauceLabs: {
      testName: 'Elpong Karma Test',
      startConnect: false,
      recordScreenshots: true
    },
    customLaunchers: customLaunchers,
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'src/**/*.ts',
      'test/**/*.ts',
      'test/**/*.coffee',
    ],
    exclude: [],
    preprocessors: {
      '**/*.ts': ENABLE_SOURCEMAPS ? ['webpack', 'sourcemap'] : ['webpack'],
      '**/*.coffee': ENABLE_SOURCEMAPS ? ['webpack', 'sourcemap'] : ['webpack'],
      '**/*.js': ENABLE_SOURCEMAPS ? ['sourcemap'] : []
    },
    plugins: (function(){
      var a = [
        'karma-jasmine',
        'karma-chrome-launcher',
        'karma-safari-launcher',
        'karma-phantomjs-launcher',
        'karma-sauce-launcher',
        'karma-webpack'
      ];
      if (ENABLE_SOURCEMAPS) a.push('karma-sourcemap-loader');
      return a;
    })(),
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: Object.keys(customLaunchers), // overridden by certain gulp tasks
    singleRun: true,
    concurrency: Infinity,
    mime: {
      // fix Chrome .ts https://github.com/angular/angular-cli/issues/2125
			'text/x-typescript': ['ts']
		},
    webpack: {
      mode: 'development',
      resolve: {
        extensions: ['.ts', '.coffee', '.js', '.json']
      },
      module: {
        rules: [
          { test: /\.coffee$/, loader: 'coffee-loader' },
          { test: /\.ts$/, loader: 'awesome-typescript-loader' },
          { test: /\.json5$/,  loader: 'json5-loader' }
        ]
      },
      plugins: ENABLE_SOURCEMAPS ? [
        new webpack.SourceMapDevToolPlugin({
          filename: null, // inline sourcemap
          test: /\.(ts|js|coffee)$/
        }),
        new webpack.EnvironmentPlugin(['FRAMEWORK'])
      ] : [new webpack.EnvironmentPlugin(['FRAMEWORK'])],
      devtool: 'inline-source-map'
    }
  })
  switch (process.env.FRAMEWORK) {
    case 'jquery':
      config.files.unshift('node_modules/jquery/dist/jquery.js', 'node_modules/jquery-mockjax/dist/jquery.mockjax.js');
      break;
    case 'angularjs':
      config.files.unshift('node_modules/angular/angular.js', 'node_modules/angular-mocks/angular-mocks.js');
      break;
  }
  if (process.env.TRAVIS) {
    config.reporters.push('saucelabs')
    config.sauceLabs.build = 'Travis #' + process.env.TRAVIS_BUILD_NUMBER + ' (' + process.env.TRAVIS_BUILD_ID + ')';
    config.sauceLabs.tunnelIdentifier = process.env.TRAVIS_JOB_NUMBER;
  }
}
