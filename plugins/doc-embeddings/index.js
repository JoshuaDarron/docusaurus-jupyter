const path = require('path');

module.exports = function docEmbeddingsPlugin() {
  return {
    name: 'doc-embeddings',
    configureWebpack(config, isServer) {
      if (isServer) {
        return {
          externals: [
            // Externalize aparavi-client (and ws transitive dep) during SSR —
            // it's only used client-side via WebSocket.
            'aparavi-client',
            'ws',
          ],
        };
      }
      return {
        module: {
          rules: [
            {
              // aparavi-client's ESM build uses bare directory imports without
              // file extensions. Disable fullySpecified so webpack resolves them.
              test: /\.js$/,
              include: path.resolve('node_modules', 'aparavi-client', 'dist', 'esm'),
              resolve: { fullySpecified: false },
            },
          ],
        },
      };
    },
  };
};
