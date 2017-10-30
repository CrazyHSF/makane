import { remote, ipcRenderer } from 'electron'
import { Injectable, OnInit } from '@angular/core'

import * as constants from '../common/constants'
import { PM, ProcessDescription, SpawnOptions } from '../background/pm-types'

const pm: PM = remote.getGlobal('pm')

@Injectable()
export class AppService implements OnInit {

  list = pm.list

  describe = pm.describe

  create = pm.create

  remove = pm.remove

  start = pm.start

  stop = pm.stop

  ngOnInit() {
    ipcRenderer.on(
      constants.channels.PROCESS_DESCRIPTION_UPDATE,
      (event: Event, description: ProcessDescription) => {
        console.log('process-description-update-event', event, description)
      },
    )
    console.log('service initialized')
  }

}
