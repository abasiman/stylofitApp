// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// allow Firebase’s “auth” (and other) package‑exports to load
defaultConfig.resolver.unstable_enablePackageExports = false;

// (if you are using any .cjs files—Firebase ships some—you may also need:)
defaultConfig.resolver.sourceExts.push('cjs');

module.exports = defaultConfig;
