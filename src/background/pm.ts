import { spawn, ChildProcess, SpawnOptions } from 'child_process'

// references: <https://github.com/unitech/pm2/blob/master/types/index.d.ts>

const globalProcessHandles: Array<ProcessHandle> = []

export type ProcessHandle = {
  name?: string
  command: string
  args?: Array<string>

  createTime: number
  startTime?: number
  stopTime?: number
  restartTime?: number
  restartCount: number

  spawnOptions?: SpawnOptions

  process?: ChildProcess
}

export type CreateProcessHandleOptions = Pick<ProcessHandle, 'name' | 'command' | 'args' | 'spawnOptions'>

export const createProcessHandle = (options: CreateProcessHandleOptions): ProcessHandle => {
  const processHandle: ProcessHandle = {
    ...options,
    createTime: Date.now(),
    restartCount: 0,
  }
  globalProcessHandles.push(processHandle)
  return processHandle
}

export const startProcess = (processHandle: ProcessHandle) => {
  processHandle.process = spawn(processHandle.command, processHandle.args, processHandle.spawnOptions)
}

export const killProcesses = (processHandles: Array<ProcessHandle>) =>
  processHandles.forEach(processHandle => processHandle.process && processHandle.process.kill())

export const killAllProcesses = () =>
  killProcesses(globalProcessHandles)
