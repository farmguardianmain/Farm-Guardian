module.exports = {
  name: 'Farm Guardian',
  slug: 'farm-guardians',
  version: '1.0.0',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#f2efe6',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.farmguardians.app',
  },
  android: {
    package: 'com.farmguardians.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
  extra: {
    eas: {
      projectId: 'ee149e7e-252b-451a-85ae-c55442b4b7e7',
    },
  },
};
