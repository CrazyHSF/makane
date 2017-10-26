import { homedir } from 'os'
import { resolve } from 'path'

export const MAKANE_HOME = resolve(homedir(), '.makane')
