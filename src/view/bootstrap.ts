import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { AppModule } from './app.module'

localStorage.debug = 'makane:*'

platformBrowserDynamic().bootstrapModule(AppModule).catch(e => console.error(e))
