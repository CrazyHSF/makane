import { SpawnOptions } from 'child_process'

export { SpawnOptions }

export type RecursivePartial<A> = {
  [K in keyof A]?: RecursivePartial<A[K]>
}

// references: <https://github.com/acdlite/flux-standard-action>
export type Action<Payload, Type extends string = string> = Readonly<{
  type: Type
  payload: Payload
}>

export type ProcessHandle = string

// serializable
export type ProcessDescription = Readonly<{
  handle: ProcessHandle
  pid?: number

  name: string
  options: ProcessOptions

  createTime: number
  startTime?: number
  stopTime?: number
  status: ProcessStatus
}>

export type ProcessStatus =
  'uninitialized' | 'launching' | 'online' |
  'stopping' | 'stopped' | 'errored'

export type ProcessOptions = Readonly<SpawnOptions & {
  command: string
  arguments: Array<string>
}>

export type ProcessOutput = Readonly<{
  handle: ProcessHandle
  content: string
}>

export type CreateProcessOptions =
  Pick<ProcessDescription, 'name' | 'options'>
