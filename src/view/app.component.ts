import * as delay from 'delay'
import { Subscription } from 'rxjs'
import * as createDebug from 'debug'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core'
import { NzMessageService, NzNotificationService } from 'ng-zorro-antd'

import { AppService } from './app.service'
import {
  ProcessHandle,
  ProcessDescription,
  ProcessStatus,
  CreateProcessOptions,
} from '../common/types'

const debug = createDebug('makane:v:c:a')

const count = (() => {
  let c = 0
  return () => {
    c += 1
    return c
  }
})()

export type ProcessViewRow = {
  readonly description: ProcessDescription
}

@Component({
  selector: 'app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {

  dataset: ReadonlyArray<ProcessViewRow> = []

  loading: boolean = false

  pageIndex: number = 1

  pageSize: number = 6

  isCreateModalVisible: boolean = false

  optionsForm: FormGroup

  optionsArgsFormControlNames: ReadonlyArray<string>

  private subscription = new Subscription()

  constructor(
    private service: AppService,
    public detector: ChangeDetectorRef,
    private zone: NgZone,
    private formBuilder: FormBuilder,
    private message: NzMessageService,
    private notification: NzNotificationService,
  ) { }

  ngOnInit() {
    this.startHandlingProcessDescriptionActions()
    this.reload()
    debug('component initialized')
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }

  reload() {
    this.dataset = this.service.list().map(description => ({ description }))
  }

  buildFormGroup(): FormGroup {
    return this.formBuilder.group({
      name: [undefined, [Validators.required]],
      command: [undefined, [Validators.required]],
    })
  }

  addArgsFormField(event?: MouseEvent) {
    if (event) event.preventDefault()
    const name = `args-${count()}`
    this.optionsArgsFormControlNames = this.optionsArgsFormControlNames.concat([name])
    this.optionsForm.addControl(name, new FormControl(undefined, Validators.required))
  }

  detachArgFormField(name: string, event?: MouseEvent) {
    if (event) event.preventDefault()
    this.optionsArgsFormControlNames = this.optionsArgsFormControlNames.filter(n => n !== name)
    this.optionsForm.removeControl(name)
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
          this.dataset = this.dataset.filter(row =>
            row.description.handle !== description.handle
          )
          const maxPageIndex = Math.ceil(this.dataset.length / this.pageSize)
          if (this.pageIndex > maxPageIndex) {
            this.pageIndex = Math.max(1, this.pageIndex - 1)
          }
          debug('receive description remove action (dataset -> %o): %o', this.dataset, description)
        })
    )
    this.subscription.add(
      this.service.observeProcessDescriptionActions.
        filter(action => action.type === 'update').
        subscribe(({ payload: description }) => {
          this.zone.run(() => {
            this.dataset = this.dataset.map(row =>
              row.description.handle !== description.handle ? row : { ...row, description }
            )
          })
          debug('receive description update action (dataset -> %o): %o', this.dataset, description)
        })
    )
  }

  onClick() {
    debug('creating test process..')
    this.service.create({
      name: 'bash-t',
      command: 'bash',
      args: ['test/loop.sh'],
    })
  }

  onReload() {
    this.reload()
    this.loading = true
    delay(200).then(() => this.loading = false).catch(ignored => ignored)
  }

  onPrepareCreate() {
    this.optionsForm = this.buildFormGroup()
    this.optionsArgsFormControlNames = []
    this.isCreateModalVisible = true
  }

  onCancelCreate() {
    debug('onCancelCreate')
    this.isCreateModalVisible = false
  }

  onCreate() {
    debug('onCreate %o', this.optionsForm)
    if (this.optionsForm.invalid) {
      this.message.warning(`Can't create process: invalid input`)
    } else {
      const options: CreateProcessOptions = {
        name: this.optionsForm.value.name,
        command: this.optionsForm.value.command,
        args: this.optionsArgsFormControlNames.map(n => this.optionsForm.value[n]),
      }
      this.notification.success('Success', 'Create process successfully')
      debug('options: %o', options)
      this.service.create(options)
      this.isCreateModalVisible = false
    }
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

  isOnline(status: ProcessStatus): boolean {
    const statuses: Array<ProcessStatus> = [
      'launching', 'online',
    ]
    return statuses.includes(status)
  }

  isOffline(status: ProcessStatus): boolean {
    const statuses: Array<ProcessStatus> = [
      'uninitialized', 'stopping', 'stopped', 'errored',
    ]
    return statuses.includes(status)
  }

}
