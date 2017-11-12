import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { NgZorroAntdModule, NZ_LOCALE, enUS } from 'ng-zorro-antd'
import { MomentModule } from 'angular2-moment'

import { PmService } from './pm.service'
import { MessagesService } from './messages.service'

import { AppComponent } from './app.component'
import { ProcessesTableComponent } from './processes-table.component'

const NgZorroLocale = { provide: NZ_LOCALE, useValue: enUS }

@NgModule({
  declarations: [
    AppComponent,
    ProcessesTableComponent,
  ],
  imports: [
    FormsModule,
    MomentModule,
    BrowserModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    NgZorroAntdModule.forRoot(),
  ],
  providers: [
    PmService,
    NgZorroLocale,
    MessagesService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
