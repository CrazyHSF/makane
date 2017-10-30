import { homedir } from 'os'
import { resolve } from 'path'

export const MAKANE_HOME = resolve(homedir(), '.makane')

export const channels = {
  PROCESS_DESCRIPTION_UPDATE: 'process-description-update-channel',
  PROCESS_OUTPUT_CHANNEL: 'process-output-channel',
  PROCESS_MONIT_CHANNEL: 'process-monit-channel',
}
