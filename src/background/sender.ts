import * as createDebug from 'debug'
import { WebContents } from 'electron'

import { actions, IPC_CHANNEL } from '../common/constants'
import {
  Action,
  ProcessDescription,
  ProcessOutputMessage,
  SpawnOptions,
} from '../common/types'

const debug = createDebug('makane:b:sender')

let getWebContents = (): WebContents | undefined => {
  throw new Error('uninitialized `getWebContents`')
}

const send = <A>(action: Action<A>) => {
  const webContents = getWebContents()
  if (webContents) {
    webContents.send(IPC_CHANNEL, action)
    // debug('send to renderer: %s', JSON.stringify(action, undefined, 2))
  } else {
    // debug('can not send to closed renderer: %s', JSON.stringify(action, undefined, 2))
  }
}

export const sendProcessDescriptionCreateMessage = (description: ProcessDescription) => {
  send({
    type: actions.PROCESS_DESCRIPTION_CREATE,
    payload: description,
  })
}

export const sendProcessDescriptionRemoveMessage = (description: ProcessDescription) => {
  send({
    type: actions.PROCESS_DESCRIPTION_REMOVE,
    payload: description,
  })
}

export const sendProcessDescriptionUpdateMessage = (description: ProcessDescription) => {
  send({
    type: actions.PROCESS_DESCRIPTION_UPDATE,
    payload: description,
  })
}

export const sendProcessOutputMessage = (output: ProcessOutputMessage) => {
  send({
    type: actions.PROCESS_OUTPUT,
    payload: output,
  })
}

export type InitializeOptions = {
  getWebContents: () => WebContents | undefined
}

export const initialize = (options: InitializeOptions) => {
  getWebContents = options.getWebContents
}
