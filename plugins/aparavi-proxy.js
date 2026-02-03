module.exports = function aparaviProxyPlugin(context, options) {
  return {
    name: 'aparavi-proxy',
    configureWebpack(config, isServer) {
      if (isServer) return {};
      const target = context.siteConfig.customFields?.APARAVI_BASE_URL || 'https://eaas.aparavi.com';
      return {
        devServer: {
          proxy: {
            '/api/aparavi': {
              target: target.replace(/\/$/, ''),
              changeOrigin: true,
              pathRewrite: { '^/api/aparavi': '' },
              secure: true,
            },
          },
        },
      };
    },
  };
};
