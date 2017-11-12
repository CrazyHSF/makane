import { remote } from 'electron'
import * as createDebug from 'debug'
import { Injectable } from '@angular/core'

import { PM } from '../background/pm-type'
import { SpawnOptions } from '../common/types'

const debug = createDebug('makane:v:s:pm')

// docs: <https://electron.atom.io/docs/api/remote/>
const pm: PM = remote.getGlobal('pm')

@Injectable()
export class PmService {

  list = pm.list

  describe = pm.describe

  create = pm.create

  remove = pm.remove

  restart = pm.start

  start = pm.start

  stop = pm.stop

}
