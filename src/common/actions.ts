import { ProcessDescription } from './types'

// references: <https://github.com/acdlite/flux-standard-action>
export type Action<Payload, Type = string> = Readonly<{
  type: Type
  payload: Payload
}>

export type ProcessDescriptionAction =
  Action<ProcessDescription, 'create' | 'update' | 'remove'>
