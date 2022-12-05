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
      apiKey: "AIzaSyBlpEBlibSE-8HaUmKGyPFmesQvHj7C5D0",

      authDomain: "scorpio-storage.firebaseapp.com",
    
      projectId: "scorpio-storage",
    
      storageBucket: "scorpio-storage.appspot.com",
    
      messagingSenderId: "727812446290",
    
      appId: "1:727812446290:web:b7e913b56d72bfde88e78b",
    
      measurementId: "G-WN3XMXF9JJ"    
    
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
