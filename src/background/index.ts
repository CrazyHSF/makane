import * as createDebug from 'debug'
import * as unhandled from 'electron-unhandled'

import * as pm from './pm'
import * as sender from './sender'
import * as listener from './listener'

const debug = createDebug('makane:b')

export type InitializeOptions = sender.InitializeOptions

export const initialize = (options: InitializeOptions) => {
  unhandled()
  listener.initialize()
  sender.initialize(options)
  pm.initialize()
  global['pm'] = pm
  debug('initialized')
}

export const terminate = () => {
  pm.terminate()
  debug('terminated')
}
