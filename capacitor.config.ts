import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'www.izus.cz',
  appName: 'iZUŠ',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    url: 'https://izustest.8u.cz/'
  },
};

export default config;
