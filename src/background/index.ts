import * as createDebug from 'debug'
import * as pm from './pm'

const debug = createDebug('makane:background')

export const initialize = async () => {
  debug('initialized')
  global['pm'] = pm
}

export const terminate = async () => {
  pm.killAllProcesses()
  debug('terminated')
}
