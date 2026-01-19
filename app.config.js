const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'FinanzIA (Dev)' : 'FinanzIA',
    slug: 'finance-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'finanzia',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV ? 'com.rogeliolb.finanzia.dev' : 'com.rogeliolb.finanzia',
    },
    android: {
      package: IS_DEV ? 'com.rogeliolb.finanzia.dev' : 'com.rogeliolb.finanzia',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      notification: {
        icon: './assets/images/adaptive-icon.png',
        color: '#7952FC',
      },
      edgeToEdgeEnabled: false,
    },
    web: {
      bundler: 'metro',
      output: 'server',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      [
        'expo-sqlite',
        {
          enableFTS: true,
          useSQLCipher: true,
          android: {
            enableFTS: false,
            useSQLCipher: false,
          },
          ios: {
            customBuildFlags: [
              '-DSQLITE_ENABLE_DBSTAT_VTAB=1 -DSQLITE_ENABLE_SNAPSHOT=1',
            ],
          },
        },
      ],
      [
        'expo-dev-client',
        {
          addGeneratedScheme: !!IS_DEV,
        },
      ],
      'expo-updates',
      'expo-font',
      'expo-web-browser',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: 'c3ba621c-93c4-4ce1-957e-f8f503281f7a',
      },
    },
    updates: {
      url: 'https://u.expo.dev/c3ba621c-93c4-4ce1-957e-f8f503281f7a',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
  },
};
