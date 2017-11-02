import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { NgZorroAntdModule, NZ_LOCALE, enUS } from 'ng-zorro-antd'
import { MomentModule } from 'angular2-moment'
import { AppComponent } from './app.component'
import { AppService } from './app.service'

const NgZorroLocale = { provide: NZ_LOCALE, useValue: enUS }

@NgModule({
  declarations: [AppComponent],
  imports: [
    FormsModule,
    MomentModule,
    BrowserModule,
    BrowserAnimationsModule,
    NgZorroAntdModule.forRoot(),
  ],
  providers: [
    AppService,
    NgZorroLocale,
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
