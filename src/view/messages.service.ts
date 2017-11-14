import * as createDebug from 'debug'
import { Injectable } from '@angular/core'
import { Subject, Subscription } from 'rxjs'
import { ipcRenderer, Event } from 'electron'

import { actions, IPC_CHANNEL } from '../common/constants'
import {
  Action,
  ProcessOutput,
  ProcessDescription,
  SpawnOptions,
} from '../common/types'

const debug = createDebug('makane:v:s:m')

type Payloads = ProcessDescription & ProcessOutput

@Injectable()
export class MessagesService {

  processDescriptionCreateMessages = new Subject<ProcessDescription>()

  processDescriptionRemoveMessages = new Subject<ProcessDescription>()

  processDescriptionUpdateMessages = new Subject<ProcessDescription>()

  processOutputMessages = new Subject<ProcessOutput>()

  private subscription = new Subscription()

  startObservingIpcMessages() {
    const listener = (event: Event, action: Action<Payloads>) => {
      debug('received ipc message { type = %o, payload = %o }', action.type, action.payload)
      switch (action.type) {
        case actions.PROCESS_DESCRIPTION_CREATE:
          return this.processDescriptionCreateMessages.next(action.payload)
        case actions.PROCESS_DESCRIPTION_REMOVE:
          return this.processDescriptionRemoveMessages.next(action.payload)
        case actions.PROCESS_DESCRIPTION_UPDATE:
          return this.processDescriptionUpdateMessages.next(action.payload)
        case actions.PROCESS_OUTPUT:
          return this.processOutputMessages.next(action.payload)
      }
    }
    ipcRenderer.on(IPC_CHANNEL, listener)
    this.subscription.add(() => ipcRenderer.removeListener(IPC_CHANNEL, listener))
    debug('start observing ipc messages')
  }

  stopObservingIpcMessages() {
    this.subscription.unsubscribe()
  }

}
