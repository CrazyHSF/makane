import { v4 as uuid } from 'uuid'
import { Observable } from 'rxjs'
import * as createDebug from 'debug'
import { WebContents } from 'electron'
import { spawn, ChildProcess, SpawnOptions } from 'child_process'
import * as constants from '../common/constants'

export { SpawnOptions } from 'child_process'

const debug = createDebug('makane:bg:pm')

// references: <https://github.com/unitech/pm2/blob/master/types/index.d.ts>

export type ProcessHandle = string

// serializable
export type ProcessDescription = Readonly<{
  handle: ProcessHandle

  name?: string
  command: string
  args?: Array<string>
  spawnOptions?: SpawnOptions

  createTime: number
  startTime?: number
  stopTime?: number
  status: ProcessStatus
}>

export type ProcessStatus = 'uninitialized' | 'launching' | 'online' | 'stopping' | 'stopped' | 'errored'

const un = <A, B>(x: A | undefined, f: (x: A) => B): B | undefined =>
  x === undefined ? undefined : f(x)

const killProcessInstance = (process?: ChildProcess) => {
  if (process && !process.killed) process.kill()
}

export type SendToRenderer = WebContents['send']

let sendToRenderer: SendToRenderer = () => {
  throw new Error('uninitialized `sendToRenderer`')
}

const internal = (() => {
  type ProcessHandleValue = Readonly<{
    description: ProcessDescription
    process?: ChildProcess
  }>
  const storage = new Map<ProcessHandle, ProcessHandleValue>()
  return {
    list: (): Array<[ProcessHandle, ProcessHandleValue]> => {
      return Array.from(storage)
    },
    get: (handle: ProcessHandle): ProcessHandleValue | undefined => {
      return storage.get(handle)
    },
    set: (handle: ProcessHandle, value: ProcessHandleValue) => {
      un(storage.get(handle), previousValue => {
        if (!value.process || value.process !== previousValue.process) {
          killProcessInstance(previousValue.process)
        }
      })
      storage.set(handle, value)
      sendToRenderer(
        constants.channels.PROCESS_DESCRIPTION_UPDATE,
        value.description,
      )
      // debug('set process handle [%s] -> %O', value.description.name || handle, value)
    },
    remove: (handle: ProcessHandle) => {
      un(storage.get(handle), v => killProcessInstance(v.process))
      const name = un(storage.get(handle), v => v.description.name)
      storage.delete(handle)
      // TODO: emit event
      debug('remove process handle [%s]', name || handle)
    },
  }
})()

export const list = (): Array<ProcessDescription> =>
  internal.list().map(([handle, { description }]) => description)

export const describe = (handle: ProcessHandle): ProcessDescription | undefined =>
  un(internal.get(handle), v => v.description)

const updateDescription = (handle: ProcessHandle, partialDescription: Partial<ProcessDescription>) => {
  un(internal.get(handle), v => {
    internal.set(handle, {
      ...v,
      description: {
        ...v.description,
        ...partialDescription,
      },
    })
  })
}

const updateStatus = (handle: ProcessHandle, status: ProcessStatus, onlyFromStatus?: ProcessStatus) => {
  un(describe(handle), description => {
    if (onlyFromStatus && onlyFromStatus !== description.status) return
    if (status === description.status) return
    updateDescription(handle, { status })
  })
}

type CreateProcessHandleOptions = Pick<ProcessDescription, 'name' | 'command' | 'args' | 'spawnOptions'>

export const create = (options: CreateProcessHandleOptions): ProcessHandle => {
  const handle = uuid()
  const description: ProcessDescription = {
    ...options,
    handle,
    createTime: Date.now(),
    status: 'uninitialized',
  }
  internal.set(handle, { description })
  debug('create process handle [%s]', description.name || handle)
  return handle
}

export const remove = internal.remove

export const start = (handle: ProcessHandle): void => {
  const description = describe(handle)
  if (!description) throw new Error(`No such handle ${handle}`)
  const process = spawn(description.command, description.args, description.spawnOptions)
  internal.set(handle, {
    description: {
      ...description,
      startTime: Date.now(),
      status: 'launching',
    },
    process,
  })
  // TODO: listeners
  process.addListener('error', (error) => {
    debug('error of process [%s] : %O', description.name || handle, error)
    updateDescription(handle, {
      stopTime: Date.now(),
      status: 'errored',
    })
  })
  process.addListener('exit', (code, signal) => {
    updateDescription(handle, {
      stopTime: Date.now(),
      status: 'stopped',
    })
  })
  process.addListener('close', (code, signal) => {
    updateDescription(handle, {
      stopTime: Date.now(),
      status: 'stopped',
    })
  })
  process.stdout.on('data', (chunk) => {
    updateStatus(handle, 'online', 'launching')
    debug('process [%s] stdout: %O', description.name || handle, String(chunk))
  })
  process.stderr.on('data', (chunk) => {
    updateStatus(handle, 'online', 'launching')
    debug('process [%s] stderr: %O', description.name || handle, String(chunk))
  })
  process.stdout.on('error', (error) => {
    debug('process [%s] stdout error: %O', description.name || handle, error)
  })
  process.stderr.on('error', (error) => {
    debug('process [%s] stderr error: %O', description.name || handle, error)
  })
  process.stdout.on('end', () => {
    debug('process [%s] stdout end', description.name || handle)
  })
  process.stderr.on('end', () => {
    debug('process [%s] stderr end', description.name || handle)
  })
  // -----
  debug('start process [%s] -> %d', description.name || handle, process.pid)
}

export const stop = (handle: ProcessHandle): void => {
  const value = internal.get(handle)
  if (!value) throw new Error(`No such handle ${handle}`)
  const { description, process } = value
  if (process) {
    killProcessInstance(process)
    updateDescription(handle, {
      stopTime: Date.now(),
      status: 'stopping',
    })
    debug('stop process [%s] -> %d', description.name || handle, process.pid)
  }
}

export type InitializeOptions = {
  sendToRenderer: SendToRenderer
}

export const initialize = (options: InitializeOptions) => {
  sendToRenderer = options.sendToRenderer
}

export const terminate = () => {
  internal.list().
    map(([handle, { process }]) => process).
    forEach(killProcessInstance)
}
