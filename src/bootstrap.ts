import "@angular/compiler";
import { AppModule } from './app/app.module';
import { bootstrap } from "@angular-architects/module-federation-tools";
import { injectLibchat } from "./app/utils/libchat";

export const bootstrapRemoteApp = (bootstrapOptions: any) => {
  injectLibchat();

  const r = bootstrap(AppModule(bootstrapOptions), {
    production: true,
    appType: 'microfrontend'
  });
  console.log('custom remote app bootstrap success!', r);
  return r;
}

