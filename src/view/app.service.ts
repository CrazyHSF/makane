import { Injectable } from '@angular/core'
import { Observable, Subject } from 'rxjs'
import { remote, ipcRenderer, Event } from 'electron'

import { PM } from '../background/pm-types'
import { channels } from '../common/constants'
import { ProcessDescriptionAction } from '../common/actions'
import { ProcessDescription, SpawnOptions } from '../common/types'

// docs: <https://electron.atom.io/docs/api/remote/>
const pm: PM = remote.getGlobal('pm')

const observeIpcMessages = <A>(channel: string) =>
  new Observable<A>(observer => {
    const listener = (event: Event, action: A) => observer.next(action)
    ipcRenderer.on(channel, listener)
    console.log('`observeIpcMessages` start')
    return () => ipcRenderer.removeListener(channel, listener)
  })

@Injectable()
export class AppService {

  list = pm.list

  describe = pm.describe

  create = pm.create

  remove = pm.remove

  start = pm.start

  stop = pm.stop

  observeProcessDescriptionActions =
    observeIpcMessages<ProcessDescriptionAction>(channels.PROCESS_DESCRIPTION).
    multicast(() => new Subject()).refCount()

}
