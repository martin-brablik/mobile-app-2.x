import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'www.izus.cz',
  appName: 'iZUŠ',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    url: 'https://m.izus.cz/'
  }
};

export default config;
