import { SpawnOptions } from 'child_process'

export { SpawnOptions }

export type ProcessHandle = string

// serializable
export type ProcessDescription = Readonly<{
  handle: ProcessHandle
  pid?: number

  name?: string
  command: string
  args?: Array<string>
  spawnOptions?: SpawnOptions

  createTime: number
  startTime?: number
  stopTime?: number
  status: ProcessStatus
}>

export type ProcessStatus =
  'uninitialized' | 'launching' | 'online' |
  'stopping' | 'stopped' | 'errored'

export type CreateProcessOptions =
  Pick<ProcessDescription, 'name' | 'command' | 'args' | 'spawnOptions'>
