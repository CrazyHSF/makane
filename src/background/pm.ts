import { v4 as uuid } from 'uuid'
import * as createDebug from 'debug'
import { WebContents } from 'electron'
import { spawn, ChildProcess } from 'child_process'

import { channels } from '../common/constants'
import { ProcessDescriptionAction } from '../common/actions'
import {
  ProcessHandle,
  ProcessDescription,
  ProcessStatus,
  CreateProcessHandleOptions,
  SpawnOptions,
} from '../common/types'

const debug = createDebug('makane:b:pm')
const warn = (formatter: string, ...args: Array<{}>) =>
  debug('WARN: ' + formatter, ...args)

// references: <https://github.com/unitech/pm2/blob/master/types/index.d.ts>

const un = <A, B>(x: A | undefined, f: (x: A) => B): B | undefined =>
  x === undefined ? undefined : f(x)

const killProcessInstance = (process?: ChildProcess) => {
  if (process && !process.killed) process.kill()
}

export type SendToRenderer = WebContents['send']

const sender = (() => {
  let sendToRenderer: SendToRenderer = () => {
    throw new Error('uninitialized `sendToRenderer`')
  }
  return {
    sendDescriptionMessage: (action: ProcessDescriptionAction) => {
      sendToRenderer(channels.PROCESS_DESCRIPTION, action)
    },
    setSendToRenderer: (send: SendToRenderer) => {
      sendToRenderer = send
    },
  }
})()

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
    select: (handle: ProcessHandle): ProcessHandleValue | undefined => {
      return storage.get(handle)
    },
    create: (handle: ProcessHandle, value: ProcessHandleValue) => {
      const previousValue = storage.get(handle)
      if (previousValue) {
        warn('create on existent ph [%s] %o', handle, value.description)
        return
      }
      storage.set(handle, value)
      sender.sendDescriptionMessage({
        type: 'create',
        payload: value.description,
      })
      debug('create on ph [%s] %o', handle, value.description)
    },
    update: (handle: ProcessHandle, value: ProcessHandleValue) => {
      const previousValue = storage.get(handle)
      if (!previousValue) {
        warn('update on nonexistent ph [%s] %o', handle, value.description)
        return
      }
      // delete or replace `process`
      if (!value.process || value.process !== previousValue.process) {
        killProcessInstance(previousValue.process)
      }
      storage.set(handle, value)
      sender.sendDescriptionMessage({
        type: 'update',
        payload: value.description,
      })
      debug('update on ph [%s] %o', handle, value.description)
    },
    remove: (handle: ProcessHandle) => {
      const previousValue = storage.get(handle)
      if (!previousValue) {
        warn('remove on nonexistent ph [%s]', handle)
        return
      }
      killProcessInstance(previousValue.process)
      storage.delete(handle)
      sender.sendDescriptionMessage({
        type: 'remove',
        payload: previousValue.description,
      })
      debug('remove on ph [%s]', handle)
    },
  }
})()

export const list = (): Array<ProcessDescription> =>
  internal.list().map(([handle, { description }]) => description)

export const describe = (handle: ProcessHandle): ProcessDescription | undefined =>
  un(internal.select(handle), v => v.description)

const updateDescription = (handle: ProcessHandle, partialDescription: Partial<ProcessDescription>) => {
  un(internal.select(handle), v => {
    internal.update(handle, {
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

export const create = (options: CreateProcessHandleOptions): ProcessHandle => {
  const handle = uuid()
  const description: ProcessDescription = {
    ...options,
    handle,
    createTime: Date.now(),
    status: 'uninitialized',
  }
  internal.create(handle, { description })
  return handle
}

export const remove = internal.remove

export const stop = (handle: ProcessHandle): void => {
  const value = internal.select(handle)
  if (!value) {
    warn('stop on nonexistent ph [%s]', handle)
    return
  }
  const { process } = value
  if (!process) {
    warn('stop uninitialized process on ph [%s]', handle)
    return
  }
  // TODO
  // process.removeAllListeners()
  // process.stdout.removeAllListeners()
  // process.stderr.removeAllListeners()
  killProcessInstance(process)
  updateDescription(handle, {
    stopTime: Date.now(),
    status: 'stopping',
  })
  debug('stop process (pid = %d) on ph [%s]', process.pid, handle)
}

export const start = (handle: ProcessHandle): void => {
  stop(handle)
  const description = describe(handle)
  if (!description) {
    warn('start on nonexistent ph [%s]', handle)
    return
  }
  const process = spawn(
    description.command, description.args, description.spawnOptions
  )
  internal.update(handle, {
    description: {
      ...description,
      pid: process.pid,
      startTime: Date.now(),
      status: 'launching',
    },
    process,
  })
  // TODO: listeners
  process.addListener('error', (error) => {
    debug('error on ph [%s]: %O', handle, error)
    updateDescription(handle, {
      stopTime: Date.now(),
      status: 'errored',
    })
  })
  process.once('exit', (code, signal) => {
    if (process.pid === un(describe(handle), d => d.pid)) {
      updateDescription(handle, {
        stopTime: Date.now(),
        status: 'stopped',
      })
    }
  })
  // process.once('close', (code, signal) => {
  //   if (process.pid === un(describe(handle), d => d.pid)) {
  //     updateDescription(handle, {
  //       stopTime: Date.now(),
  //       status: 'stopped',
  //     })
  //   }
  // })
  process.stdout.once('data', (chunk) => {
    updateStatus(handle, 'online', 'launching')
  })
  process.stderr.once('data', (chunk) => {
    updateStatus(handle, 'online', 'launching')
  })
  process.stdout.on('data', (chunk) => {
    debug('stdout on ph [%s]: %o', handle, String(chunk))
  })
  process.stderr.on('data', (chunk) => {
    debug('stderr on ph [%s]: %o', handle, String(chunk))
  })
  process.stdout.on('error', (error) => {
    debug('error of stdout on ph [%s]: %O', handle, error)
  })
  process.stderr.on('error', (error) => {
    debug('error of stderr on ph [%s]: %O', handle, error)
  })
  process.stdout.on('end', () => {
    debug('end of stdout on ph [%s]', handle)
  })
  process.stderr.on('end', () => {
    debug('end of stderr on ph [%s]', handle)
  })
  // -----
  debug('start process (pid = %d) on ph [%s]', process.pid, handle)
}

export type InitializeOptions = {
  sendToRenderer: SendToRenderer
}

export const initialize = (options: InitializeOptions) => {
  sender.setSendToRenderer(options.sendToRenderer)
}

export const terminate = () => {
  internal.list().
    map(([handle, { process }]) => process).
    forEach(killProcessInstance)
}
