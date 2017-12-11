import * as createDebug from 'debug'

import * as pm from './pm'
import * as listener from './listener'

const debug = createDebug('makane:b')

export type InitializeOptions = pm.InitializeOptions

export const initialize = (options: InitializeOptions) => {
  listener.initialize()
  pm.initialize(options)
  global['pm'] = pm
  debug('initialized')
}

export const terminate = () => {
  pm.terminate()
  debug('terminated')
}
