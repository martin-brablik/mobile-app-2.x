import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'www.izus.cz',
  appName: 'iZUŠ',
  webDir: 'dist',
  appendUserAgent: '; iZUS-mobile-app/2.1.1',
  server: {
    androidScheme: 'http',
    url: 'https://izustest.8u.cz/'
  }
};

export default config;
