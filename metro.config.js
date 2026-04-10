const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Watch all relevant file extensions including assets
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'mjs',
  'cjs',
];

// Ensure Fast Refresh is enabled and file watching covers the whole project
config.watchFolders = [__dirname];

// Faster bundling — skip haste for node_modules
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
