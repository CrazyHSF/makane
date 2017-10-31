import { homedir } from 'os'
import { resolve } from 'path'

export const MAKANE_HOME = resolve(homedir(), '.makane')

export const channels = Object.freeze({
  PROCESS_DESCRIPTION: 'PROCESS_DESCRIPTION',
  PROCESS_OUTPUT: 'PROCESS_OUTPUT',
  PROCESS_MONIT: 'PROCESS_MONIT',
})
