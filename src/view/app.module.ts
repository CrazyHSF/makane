import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { AppComponent } from './app.component'
import { PMService } from './pm.service'

@NgModule({
  imports: [BrowserModule],
  declarations: [AppComponent],
  providers: [PMService],
  bootstrap: [AppComponent],
})
export class AppModule { }
