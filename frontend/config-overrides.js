module.exports = function override(config, env) {
  // Désactiver ESLint complètement
  config.plugins = config.plugins.filter(
    plugin => plugin.constructor.name !== 'ESLintWebpackPlugin'
  );
  
  // Désactiver les warnings
  config.ignoreWarnings = [/.*/];
  
  return config;
};

