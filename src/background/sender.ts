import { actions, IPC_CHANNEL } from '../common/constants'
import {
  Action,
  ProcessHandle,
  ProcessDescription,
  ProcessOutputMessage,
  SpawnOptions,
} from '../common/types'

export type SendToRenderer = <A>(channel: string, action: Action<A>) => void

let sendToRenderer: SendToRenderer = () => {
  throw new Error('uninitialized `sendToRenderer`')
}

export const setSendToRenderer = (send: SendToRenderer) => {
  sendToRenderer = send
}

export const sendProcessDescriptionCreateMessage = (description: ProcessDescription) => {
  sendToRenderer<ProcessDescription>(IPC_CHANNEL, {
    type: actions.PROCESS_DESCRIPTION_CREATE,
    payload: description,
  })
}

export const sendProcessDescriptionRemoveMessage = (description: ProcessDescription) => {
  sendToRenderer<ProcessDescription>(IPC_CHANNEL, {
    type: actions.PROCESS_DESCRIPTION_REMOVE,
    payload: description,
  })
}

export const sendProcessDescriptionUpdateMessage = (description: ProcessDescription) => {
  sendToRenderer<ProcessDescription>(IPC_CHANNEL, {
    type: actions.PROCESS_DESCRIPTION_UPDATE,
    payload: description,
  })
}

export const sendProcessOutputMessage = (output: ProcessOutputMessage) => {
  sendToRenderer<ProcessOutputMessage>(IPC_CHANNEL, {
    type: actions.PROCESS_OUTPUT,
    payload: output,
  })
}
