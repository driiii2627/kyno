import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kyno.app',
  appName: 'Kyno',
  webDir: 'public',
  server: {
    url: 'https://kynoo.vercel.app/',
    androidScheme: 'https',
    errorPath: 'offline.html'
  }
};

export default config;
