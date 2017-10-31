import * as createDebug from 'debug'
import * as pm from './pm'

const debug = createDebug('makane:b')

export type InitializeOptions = pm.InitializeOptions

export const initialize = async (options: InitializeOptions) => {
  pm.initialize(options)
  global['pm'] = pm
  debug('initialized')
}

export const terminate = async () => {
  pm.terminate()
  debug('terminated')
}
