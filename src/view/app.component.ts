import { Subscription } from 'rxjs'
import * as createDebug from 'debug'
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'

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
export class AppComponent implements OnInit, OnDestroy {

  dataset: Array<ProcessData> = this.service.list().map(description => ({ description }))

  private subscription = new Subscription()

  constructor(
    private service: AppService,
    private detector: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.startHandlingProcessDescriptionActions()
    debug('component initialized')
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }

  startHandlingProcessDescriptionActions() {
    this.subscription.add(
      this.service.observeProcessDescriptionActions.
        filter(action => action.type === 'create').
        subscribe(({ payload: description }) => {
          this.dataset = this.dataset.concat([{ description }])
          debug('receive description create action (dataset -> %o): %o', this.dataset, description)
        })
    )
    this.subscription.add(
      this.service.observeProcessDescriptionActions.
        filter(action => action.type === 'remove').
        subscribe(({ payload: description }) => {
          this.dataset = this.dataset.filter(d =>
            d.description.handle !== description.handle
          )
          debug('receive description remove action (dataset -> %o): %o', this.dataset, description)
          this.detector.detectChanges()
        })
    )
    this.subscription.add(
      this.service.observeProcessDescriptionActions.
        filter(action => action.type === 'update').
        subscribe(({ payload: description }) => {
          this.dataset = this.dataset.map(d =>
            d.description.handle !== description.handle ? d : { ...d, description }
          )
          debug('receive description update action (dataset -> %o): %o', this.dataset, description)
          this.detector.detectChanges()
        })
    )
  }

  onClick() {
    debug('click..')
    this.onCreate({
      name: 'bash-t',
      command: 'bash',
      args: ['test/loop.sh'],
    })
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
