import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {SharedModule} from './shared/shared.module';
import {HomeModule} from './modules/home/home.module';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DashboardModule} from './modules/dashboard/dashboard.module';
import {TokenInterceptor} from './shared/helpers/token.interceptor';
import { AngularFireStorageModule } from 'angularfire2/storage'
import { AngularFireModule } from 'angularfire2';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SharedModule,
    HomeModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    DashboardModule,
    AngularFireModule.initializeApp({
      apiKey: "AIzaSyBOWkRg9dmAqJiDyLkTskiEswPLzsF2iac",

      authDomain: "cool-continuity-368410.firebaseapp.com",
    
      projectId: "cool-continuity-368410",
    
      storageBucket: "cool-continuity-368410.appspot.com",
    
      messagingSenderId: "825023183913",
    
      appId: "1:825023183913:web:3ed2d924f853abfce3f038"
    
    }),
    AngularFireStorageModule
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
