const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig({
  name: 'Farm Guardians',
  slug: 'farm-guardians',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#2D6A4F',
  },
  assetBundlePatterns: [
    '**/*',
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.farmguardians.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#2D6A4F',
    },
    package: 'com.farmguardians.app',
    versionCode: '1',
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [],
  extra: {
    eas: {
      projectId: 'farm-guardian-bb535',
    },
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
});
