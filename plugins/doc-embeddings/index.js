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
      return {};
    },
  };
};
