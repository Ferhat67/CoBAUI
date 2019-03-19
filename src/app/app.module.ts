import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { COBAUIModule } from 'cobaui';
import { AdaptationController } from 'cobaui';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    COBAUIModule // Import CBAUI Framework into application
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {

  // Inject Adaptation Controller
  constructor(ac: AdaptationController) {
    // Register components to Adaptation Controller to initialize Adaptive UI
  }
}
