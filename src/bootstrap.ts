import "@angular/compiler";
import { AppModule } from './app/app.module';
import { bootstrap } from "@angular-architects/module-federation-tools";
import { injectMatomo } from './app/utils/matomo';
import { injectLibchat } from "./app/utils/libchat";

export const bootstrapRemoteApp = (bootstrapOptions: any) => {
  // Keep bootstrap minimal: always inject Matomo from helper.
  injectMatomo();
  injectLibchat();

  return bootstrap(AppModule(bootstrapOptions), {
    production: true,
    appType: 'microfrontend'
  }).then(r => {
    console.log('custom remote app bootstrap success!', r);
    return r
  });
}

