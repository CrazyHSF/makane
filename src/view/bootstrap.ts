import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { enableProdMode } from '@angular/core'
import * as isDevMode from 'electron-is-dev'
import { AppModule } from './app.module'

if (!isDevMode) enableProdMode()

localStorage.debug = 'makane:*'

// tslint:disable-next-line: no-floating-promises
platformBrowserDynamic().bootstrapModule(AppModule)
