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
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { GlobalChatModule } from './modules/global-chat/global.module';

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
    GlobalChatModule,
    AngularFireModule.initializeApp({
      apiKey: "AIzaSyCcd6voKLuI4ikKBNX6Gipa2VRWkQXBKRE",
      authDomain: "scorpio-store-38761.firebaseapp.com",
      projectId: "scorpio-store-38761",
      storageBucket: "scorpio-store-38761.appspot.com",
      messagingSenderId: "939378835082",
      appId: "1:939378835082:web:4c7eda5dafd1509901b773"
    }),
    AngularFireStorageModule,
    NgMultiSelectDropDownModule
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
