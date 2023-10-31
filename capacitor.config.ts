import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'www.izus.cz',
  appName: 'iZUŠ',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    url: 'https://m.izus.cz/'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: false,
      backgroundColor: '#FFFFFF',
    }
  }
};

export default config;
