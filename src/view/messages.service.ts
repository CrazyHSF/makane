import * as createDebug from 'debug'
import { Injectable } from '@angular/core'
import { Subject, Subscription } from 'rxjs'
import { ipcRenderer, Event } from 'electron'

import { actions, IPC_CHANNEL } from '../common/constants'
import { Action, ProcessDescription, SpawnOptions } from '../common/types'

const debug = createDebug('makane:v:s:m')

@Injectable()
export class MessagesService {

  observeProcessDescriptionCreateMessages = new Subject<ProcessDescription>()

  observeProcessDescriptionRemoveMessages = new Subject<ProcessDescription>()

  observeProcessDescriptionUpdateMessages = new Subject<ProcessDescription>()

  private subscription = new Subscription()

  startObservingIpcMessages() {
    const listener = (event: Event, action: Action<any>) => {
      switch (action.type) {
        case actions.PROCESS_DESCRIPTION_CREATE:
          return this.observeProcessDescriptionCreateMessages.next(action.payload)
        case actions.PROCESS_DESCRIPTION_REMOVE:
          return this.observeProcessDescriptionRemoveMessages.next(action.payload)
        case actions.PROCESS_DESCRIPTION_UPDATE:
          return this.observeProcessDescriptionUpdateMessages.next(action.payload)
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
