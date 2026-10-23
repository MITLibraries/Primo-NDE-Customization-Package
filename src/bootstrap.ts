import '@angular/compiler';
import { AppModule } from './app/app.module';
import { bootstrap } from '@angular-architects/module-federation-tools';

declare const CUSTOMIZATION_BUILD_ID: string;

export const bootstrapRemoteApp = (bootstrapOptions: any) => {
  console.info(`[MIT Libraries customization] Build ID: ${CUSTOMIZATION_BUILD_ID}`);
  return bootstrap(AppModule(bootstrapOptions), {
    production: true,
    appType: 'microfrontend',
  }).then((r) => {
    console.log('custom remote app bootstrap success!', r);
    return r;
  });
};
