module.exports = {
  webpack: (config) => {
    // Désactiver complètement ESLint
    config.plugins = config.plugins.filter(
      plugin => plugin.constructor.name !== 'ESLintWebpackPlugin'
    );
    
    // Ignorer tous les warnings
    config.ignoreWarnings = [/./];
    
    // Performance
    config.performance = {
      hints: false,
      maxAssetSize: 512000,
      maxEntrypointSize: 512000
    };
    
    return config;
  },
  devServer: (config) => {
    config.client = {
      overlay: false
    };
    return config;
  }
};

