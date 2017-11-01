import * as createDebug from 'debug'
import { Component, OnInit } from '@angular/core'

import { AppService } from './app.service'
import {
  ProcessHandle,
  ProcessDescription,
  ProcessStatus,
  CreateProcessHandleOptions,
} from '../common/types'

const debug = createDebug('makane:v:c:a')

export type ProcessData = {
  description: ProcessDescription
}

@Component({
  selector: 'app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {

  dataset: Array<ProcessData> =
    this.service.list().map(description => ({ description }))

  constructor(private service: AppService) { }

  ngOnInit() {
    this.handlingProcessDescriptionActions()
    debug('component initialized')
  }

  handlingProcessDescriptionActions() {
    this.service.observeProcessDescriptionActions.
      filter(action => action.type === 'create').
      subscribe(({ payload: description }) => {
        this.dataset = this.dataset.concat([{ description }])
        debug('handling create action: %o', description)
      })
    this.service.observeProcessDescriptionActions.
      filter(action => action.type === 'remove').
      subscribe(({ payload: description }) => {
        const index = this.dataset.findIndex(d =>
          d.description.handle !== description.handle
        )
        if (index !== -1) this.dataset.splice(index, 1)
        // this.dataset = this.dataset.filter(d =>
        //   d.description.handle !== description.handle
        // )
        debug('handling remove action: %o', description)
      })
    this.service.observeProcessDescriptionActions.
      filter(action => action.type === 'update').
      subscribe(({ payload: description }) => {
        const data = this.dataset.find(d =>
          d.description.handle !== description.handle
        )
        if (data) data.description = description
        // this.dataset = this.dataset.map(d =>
        //   d.description.handle !== description.handle ? d : { ...d, description }
        // )
        debug('handling update action: %o', description)
      })
    this.service.observeProcessDescriptionActions.
      subscribe(action => {
        debug(
          'receive process description action (type = %s, status = %s, description = %o)',
          action.type, action.payload.status, action.payload,
        )
      })
  }

  async onClick() {
    debug('clicked')

    this.onCreate({
      name: 'bash-t',
      command: 'bash',
      args: ['test/loop.sh'],
    })

    // await delay(1000)

    // this.service.start(handle)

    // await delay(5000)

    // this.service.stop(handle)

    // await delay(1000)

    // this.service.remove(handle)
  }

  readyToStart(status: ProcessStatus) {
    const readyToStartStatus: Array<ProcessStatus> = [
      'uninitialized', 'stopping', 'stopped', 'errored',
    ]
    return readyToStartStatus.includes(status)
  }

  readyToStop(status: ProcessStatus) {
    const readyToStopStatus: Array<ProcessStatus> = [
      'launching', 'online',
    ]
    return readyToStopStatus.includes(status)
  }

  onCreate(options: CreateProcessHandleOptions) {
    this.service.create(options)
  }

  onRemove(handle: ProcessHandle) {
    this.service.remove(handle)
  }

  onRestart(handle: ProcessHandle) {
    this.service.restart(handle)
  }

  onStart(handle: ProcessHandle) {
    this.service.start(handle)
  }

  onStop(handle: ProcessHandle) {
    this.service.stop(handle)
  }

}
