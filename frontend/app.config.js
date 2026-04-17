module.exports = {
  name: 'Farm Guardians',
  slug: 'farm-guardians',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
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
    versionCode: 1,
  },
  extra: {
    eas: {
      projectId: 'ee149e7e-252b-451a-85ae-c55442b4b7e7',
    },
  },
  web: {
    favicon: './assets/favicon.png',
  bundler: 'metro',
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
};
