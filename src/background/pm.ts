import { v4 as uuid } from 'uuid'
import * as createDebug from 'debug'
import { spawn, ChildProcess } from 'child_process'

import * as sender from './sender'
import {
  ProcessHandle,
  ProcessDescription,
  CreateProcessOptions,
  SpawnOptions,
} from '../common/types'

const debug = createDebug('makane:b:pm')
const warn = (formatter: string, ...xs: Array<{}>) =>
  debug('WARN: ' + formatter, ...xs)

// references: <https://github.com/unitech/pm2/blob/master/types/index.d.ts>

const now = () => Math.floor(Date.now() / 1000)

const un = <A, B>(x: A | undefined, f: (x: A) => B): B | undefined =>
  x === undefined ? undefined : f(x)

const killProcessInstance = (process?: ChildProcess) => {
  if (process && !process.killed) process.kill()
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
      sender.sendProcessDescriptionCreateMessage(value.description)
      debug('create on ph [%s] %o', handle, value.description)
    },
    remove: (handle: ProcessHandle) => {
      const previousValue = storage.get(handle)
      if (!previousValue) {
        warn('remove on nonexistent ph [%s]', handle)
        return
      }
      killProcessInstance(previousValue.process)
      storage.delete(handle)
      sender.sendProcessDescriptionRemoveMessage(previousValue.description)
      debug('remove on ph [%s]', handle)
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
      sender.sendProcessDescriptionUpdateMessage(value.description)
      debug('update on ph [%s] %o', handle, value.description)
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

export const create = (options: CreateProcessOptions): ProcessHandle => {
  const handle = uuid()
  const description: ProcessDescription = {
    ...options,
    handle,
    createTime: now(),
    status: 'uninitialized',
  }
  internal.create(handle, { description })
  return handle
}

export const remove = internal.remove

const waitForProcessEnd = (process: ChildProcess) =>
  new Promise<void>((resolve, reject) => {
    process.once('error', reject)
    process.once('exit', resolve)
  })

const stopAndWait = async (handle: ProcessHandle): Promise<void> => {
  const value = internal.select(handle)
  if (!value) {
    warn('stop on nonexistent ph [%s]', handle)
    return
  }
  const { description, process } = value
  if (!process) {
    warn('stop uninitialized process on ph [%s]', handle)
    return
  }
  const shouldWait = ['launching', 'online'].includes(description.status)
  const waiting = shouldWait ? waitForProcessEnd(process) : undefined
  killProcessInstance(process)
  updateDescription(handle, { status: 'stopping' })
  debug('stop process (pid = %d) on ph [%s]', process.pid, handle)
  return waiting
}

export const stop = (handle: ProcessHandle): void => {
  stopAndWait(handle).catch(error =>
    warn('error while stopping ph [%s]: %O', handle, error)
  )
}

const updateErroredStatus = (handle: ProcessHandle, pid: number) => {
  un(describe(handle), description => {
    if (description.pid === pid) {
      updateDescription(handle, { stopTime: now(), status: 'errored' })
    }
  })
}

const updateStoppedStatus = (handle: ProcessHandle, pid: number) => {
  un(describe(handle), description => {
    if (description.pid === pid) {
      updateDescription(handle, { stopTime: now(), status: 'stopped' })
    }
  })
}

const updateOnlineStatus = (handle: ProcessHandle) => {
  un(describe(handle), description => {
    if (description.status === 'launching') {
      updateDescription(handle, { status: 'online' })
    }
  })
}

const startAndWait = async (handle: ProcessHandle): Promise<void> => {
  await stopAndWait(handle).catch(error =>
    warn('error while stopping ph [%s]: %O', handle, error)
  )
  const description = describe(handle)
  if (!description) {
    warn('start on nonexistent ph [%s]', handle)
    return
  }
  const process = spawn(
    description.options.command,
    description.options.arguments,
    description.options,
  )
  internal.update(handle, {
    description: {
      ...description,
      pid: process.pid,
      startTime: now(),
      status: 'launching',
    },
    process,
  })
  process.on('error', (error) => {
    debug('error on ph [%s]: %O', handle, error)
    updateErroredStatus(handle, process.pid)
  })
  process.on('exit', (code, signal) => {
    debug('exit on ph [%s]: (code = %d, signal = %s)', handle, code, signal)
    updateStoppedStatus(handle, process.pid)
  })
  process.stdout.once('data', () => updateOnlineStatus(handle))
  process.stderr.once('data', () => updateOnlineStatus(handle))
  // TODO: listeners
  // ↓↓↓↓↓
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
  // ↑↑↑↑↑
  debug('start process (pid = %d) on ph [%s]', process.pid, handle)
}

export const start = (handle: ProcessHandle): void => {
  startAndWait(handle).catch(error =>
    warn('error while starting ph [%s]: %O', handle, error)
  )
}

export type InitializeOptions = {
  sendToRenderer: sender.SendToRenderer
}

export const initialize = (options: InitializeOptions) => {
  sender.setSendToRenderer(options.sendToRenderer)
}

export const terminate = () => {
  internal.list().
    map(([handle, { process }]) => process).
    forEach(killProcessInstance)
}
