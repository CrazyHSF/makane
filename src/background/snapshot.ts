import { readFile } from 'mz/fs'
import * as createDebug from 'debug'
import { dialog, FileFilter } from 'electron'

import { create } from './pm'
import { CreateProcessOptions, DeepPartial } from '../common/types'
import { PROCESSES_SNAPSHOT_API_VERSION } from '../common/constants'

const debug = createDebug('makane:b:snapshot')

type ProcessesSnapshot = {
  version: string
  // TODO
  cpos: Array<CreateProcessOptions>
}

const filters: Array<FileFilter> = [
  { name: 'JSON', extensions: ['json'] },
]

const verify = (snapshot: DeepPartial<ProcessesSnapshot>): ProcessesSnapshot => {
  // TODO
  throw new Error('not implemented')
}

export const save = () => {
  debug('saving snapshot')

  dialog.showSaveDialog({ filters }, async filename => {

    if (!filename) {
      debug('user clicked cancel')
      return
    }

    debug('save snapshot to \'%s\'', filename)

    // TODO
  })
}

export const load = () => {
  debug('loading snapshot')

  dialog.showOpenDialog({ filters, properties: ['openFile'] }, async filenames => {

    if (!filenames) {
      debug('user clicked cancel')
      return
    }

    const filename = filenames[0]

    debug('load snapshot from \'%s\'', filename)

    try {

      const text = await readFile(filename, 'utf-8')

      const snapshot = verify(JSON.parse(text.replace(/\/\/.*\n/g, '')))

      debug('read snapshot: %s', JSON.stringify(snapshot, undefined, 2))

      snapshot.cpos.forEach(create)

    } catch (error) {
      debug('error while loading snapshot: %O', error)
    }
  })
}
