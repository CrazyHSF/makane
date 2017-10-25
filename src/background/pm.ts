import { v4 as uuid } from 'uuid'
import { spawn, ChildProcess, SpawnOptions } from 'child_process'

// references: <https://github.com/unitech/pm2/blob/master/types/index.d.ts>

export type ProcessHandle = string

type ProcessHandleValue = {
  readonly description: ProcessDescription
  process?: ChildProcess
}

const globalProcessHandles = new Map<ProcessHandle, ProcessHandleValue>()

// should be serializable
export type ProcessDescription = {
  readonly handle: ProcessHandle

  name?: string
  command: string
  args?: Array<string>
  spawnOptions?: SpawnOptions

  readonly createTime: number
  startTime?: number
  stopTime?: number
  restartTime?: number
  restartCount: number
  status: ProcessStatus
}

export type ProcessStatus = 'uninitialized' | 'launching' | 'online' | 'stopping' | 'stopped' | 'errored'

export type CreateProcessHandleOptions = Pick<ProcessDescription, 'name' | 'command' | 'args' | 'spawnOptions'>

const u = <A, B>(x: A | undefined, f: (x: A) => B): B | undefined =>
  x === undefined ? undefined : f(x)

export const createProcessHandle = (options: CreateProcessHandleOptions): ProcessHandle => {
  const handle = uuid()
  const description: ProcessDescription = {
    ...options,
    handle,
    createTime: Date.now(),
    restartCount: 0,
    status: 'uninitialized',
  }
  globalProcessHandles.set(handle, { description })
  return handle
}

export const deleteProcessHandle = (handle: ProcessHandle): boolean => {
  killProcess(handle)
  return globalProcessHandles.delete(handle)
}

const getProcessValue = (handle: ProcessHandle): ProcessHandleValue => {
  const handleValue = globalProcessHandles.get(handle)
  if (!handleValue) throw new Error(`No such handle ${handle}`)
  return handleValue
}

export const getProcessDescription = (handle: ProcessHandle): ProcessDescription =>
  getProcessValue(handle).description

export const getProcessInstance = (handle: ProcessHandle): ChildProcess | undefined =>
  getProcessValue(handle).process

export const setProcessInstance = (handle: ProcessHandle, process: ChildProcess): void => {
  getProcessValue(handle).process = process
}

export const startProcess = (handle: ProcessHandle): void => {
  killProcess(handle)
  const description = getProcessDescription(handle)
  const process = spawn(description.command, description.args, description.spawnOptions)
  description.status = 'launching'
  description.startTime = Date.now()
  // TODO: process.on
  setProcessInstance(handle, process)
}

const killProcessInstance = (process: ChildProcess): void => {
  if (!process.killed) process.kill()
}

export const killProcess = (handle: ProcessHandle): void =>
  u(getProcessInstance(handle), killProcessInstance)

export const killProcesses = (handles: Iterable<ProcessHandle>): void => {
  for (const handle of handles) killProcess(handle)
}

export const killAllProcesses = (): void =>
  killProcesses(globalProcessHandles.keys())
