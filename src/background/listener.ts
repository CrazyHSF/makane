import { ipcMain } from 'electron'
import * as snapshot from './snapshot'
import { Action } from '../common/types'
import { actions, IPC_CHANNEL } from '../common/constants'

export const initialize = () => {
  const listener = (event: Event, action: Action<never>) => {
    switch (action.type) {
      case actions.SAVE_PROCESSES_SNAPSHOT:
        return snapshot.save()
      case actions.LOAD_PROCESSES_SNAPSHOT:
        return snapshot.load()
    }
  }
  ipcMain.on(IPC_CHANNEL, listener)
}
