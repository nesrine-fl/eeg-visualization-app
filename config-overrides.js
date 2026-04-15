module.exports = function (webpackConfig) {
  // Suppress source map warnings from MediaPipe
  webpackConfig.module.rules.push({
    test: /\.m?js$/,
    enforce: 'pre',
    use: [
      {
        loader: 'source-map-loader',
        options: {
          filterSourceMappingUrl: (url, resourcePath) => {
            // Filter out MediaPipe source maps that don't exist
            if (url.includes('@mediapipe/tasks-vision')) {
              return false;
            }
            return true;
          }
        }
      }
    ]
  });

  return webpackConfig;
};
