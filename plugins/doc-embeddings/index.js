module.exports = function docEmbeddingsPlugin() {
  return {
    name: 'doc-embeddings',
    configureWebpack(config, isServer) {
      if (isServer) {
        return {
          externals: [
            // Externalize @huggingface/transformers during SSR —
            // it's only used client-side via dynamic import().
            '@huggingface/transformers',
          ],
        };
      }
      return {};
    },
  };
};
