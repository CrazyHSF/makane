import { v4 as uuid } from 'uuid'
import * as createDebug from 'debug'
import { spawn, ChildProcess } from 'child_process'

import * as sender from './sender'
import { now } from '../common/time'
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
        warn('conflict while creating ph [%s] %o', handle, value.description)
        return
      }
      storage.set(handle, value)
      sender.sendProcessDescriptionCreateMessage(value.description)
      debug('create ph [%s] %o', handle, value.description)
    },
    remove: (handle: ProcessHandle) => {
      const previousValue = storage.get(handle)
      if (!previousValue) {
        warn('remove nonexistent ph [%s]', handle)
        return
      }
      killProcessInstance(previousValue.process)
      storage.delete(handle)
      sender.sendProcessDescriptionRemoveMessage(previousValue.description)
      debug('remove ph [%s]', handle)
    },
    update: (handle: ProcessHandle, value: ProcessHandleValue) => {
      const previousValue = storage.get(handle)
      if (!previousValue) {
        warn('update nonexistent ph [%s] %o', handle, value.description)
        return
      }
      // delete or replace `process`
      if (!value.process || value.process !== previousValue.process) {
        killProcessInstance(previousValue.process)
      }
      storage.set(handle, value)
      sender.sendProcessDescriptionUpdateMessage(value.description)
      debug('update ph [%s] %o', handle, value.description)
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
    status: 'uninitialized',
    createTime: now(),
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
    warn('stop nonexistent ph [%s]', handle)
    return
  }

  const { description, process } = value
  if (!process) return

  killProcessInstance(process)

  const isOnline = ['launching', 'online'].includes(description.status)
  const waiting = isOnline ? waitForProcessEnd(process) : undefined
  if (isOnline) {
    updateDescription(handle, { status: 'stopping' })
  }

  debug('stop process (pid = %d) of ph [%s]', process.pid, handle)

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
      updateDescription(handle, { status: 'errored', stopTime: now() })
    }
  })
}

const updateStoppedStatus = (handle: ProcessHandle, pid: number) => {
  un(describe(handle), description => {
    if (description.pid === pid) {
      updateDescription(handle, { status: 'stopped', stopTime: now() })
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
    warn('start nonexistent ph [%s]', handle)
    return
  }

  try {
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

    const onceProcessOutput = () => updateOnlineStatus(handle)
    process.stdout.once('data', onceProcessOutput)
    process.stderr.once('data', onceProcessOutput)

    const onProcessOutput = (chunk: Buffer | string) => {
      const content = String(chunk)
      debug('output of ph [%s]: %o', handle, content)
      sender.sendProcessOutputMessage({ handle, content })
    }
    process.stdout.on('data', onProcessOutput)
    process.stderr.on('data', onProcessOutput)

    debug('start process (pid = %d) of ph [%s]', process.pid, handle)

  } catch (error) {
    debug('caught error on ph [%s]: %O', handle, error)
    updateDescription(handle, { status: 'errored', stopTime: now() })
  }
}

export const start = (handle: ProcessHandle): void => {
  startAndWait(handle).catch(error =>
    warn('error while starting ph [%s]: %O', handle, error)
  )
}

export const initialize = () => {
  debug('initialized')
}

export const terminate = () => {
  internal.list().
    map(([handle, { process }]) => process).
    forEach(killProcessInstance)
}
