import * as delay from 'delay'
import * as createDebug from 'debug'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core'
import { NzMessageService, NzNotificationService } from 'ng-zorro-antd'

import { PmService } from './pm.service'
import { MessagesService } from './messages.service'
import { CreateProcessOptions } from '../common/types'
import { ProcessViewRow } from './processes-table.component'

const debug = createDebug('makane:v:c:a')

const count = (() => {
  let c = 0
  return () => {
    c += 1
    return c
  }
})()

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

  optionsArgumentsFormControlNames: ReadonlyArray<string>

  constructor(
    private pm: PmService,
    private messages: MessagesService,
    public detector: ChangeDetectorRef,
    private zone: NgZone,
    private formBuilder: FormBuilder,
    private message: NzMessageService,
    private notification: NzNotificationService,
  ) { }

  ngOnInit() {
    this.messages.startObservingIpcMessages()
    this.startHandlingProcessDescriptionMessages()
    this.startHandlingProcessOutputMessages()
    this.reload()
    debug('component initialized')
  }

  ngOnDestroy() {
    this.messages.stopObservingIpcMessages()
  }

  reload() {
    this.dataset = this.pm.list().map(description => ({ description }))
  }

  buildFormGroup(): FormGroup {
    return this.formBuilder.group({
      name: [undefined, [Validators.required]],
      command: [undefined, [Validators.required]],
    })
  }

  addArgumentsFormField(event?: MouseEvent) {
    if (event) event.preventDefault()
    const name = `argument-${count()}`
    this.optionsArgumentsFormControlNames =
      [...this.optionsArgumentsFormControlNames, name]
    this.optionsForm.addControl(name, new FormControl(undefined, Validators.required))
  }

  detachArgFormField(name: string, event?: MouseEvent) {
    if (event) event.preventDefault()
    this.optionsArgumentsFormControlNames =
      this.optionsArgumentsFormControlNames.filter(n => n !== name)
    this.optionsForm.removeControl(name)
  }

  startHandlingProcessDescriptionMessages() {
    this.messages.processDescriptionCreateMessages.subscribe(description => {
      this.dataset = [...this.dataset, { description }]
    })
    this.messages.processDescriptionRemoveMessages.subscribe(description => {
      this.dataset = this.dataset.filter(row =>
        row.description.handle !== description.handle
      )
      const maxPageIndex = Math.max(1, Math.ceil(this.dataset.length / this.pageSize))
      if (this.pageIndex > maxPageIndex) { this.pageIndex = maxPageIndex }
    })
    this.messages.processDescriptionUpdateMessages.subscribe(description => {
      this.zone.run(() => {
        this.dataset = this.dataset.map(row =>
          row.description.handle !== description.handle ? row : { ...row, description }
        )
      })
    })
  }

  startHandlingProcessOutputMessages() {
    this.messages.processOutputMessages.subscribe(({ handle, content }) => {
      debug('output of ph [%s]: %o', handle, content)
    })
  }

  onTClick() {
    debug('creating test process..')
    this.pm.create({
      name: 'bash-t',
      options: {
        command: 'bash',
        arguments: ['test/loop.sh'],
      },
    })
  }

  onReload() {
    this.reload()
    this.loading = true
    delay(200).then(() => this.loading = false).catch(ignored => ignored)
  }

  onPrepareCreate() {
    this.optionsForm = this.buildFormGroup()
    this.optionsArgumentsFormControlNames = []
    this.isCreateModalVisible = true
  }

  onCancelCreate() {
    this.isCreateModalVisible = false
  }

  onCreate() {
    debug('options form %o', this.optionsForm)
    if (this.optionsForm.invalid) {
      this.message.warning(`Can't create process: invalid input`)
    } else {
      const processArguments =
        this.optionsArgumentsFormControlNames.map(n => this.optionsForm.value[n])
      const options: CreateProcessOptions = {
        name: this.optionsForm.value.name,
        options: {
          command: this.optionsForm.value.command,
          arguments: processArguments,
        },
      }
      this.notification.success(
        'Success',
        `Create process ${options.name} successfully`,
      )
      debug('options: %o', options)
      this.pm.create(options)
      this.isCreateModalVisible = false
    }
  }

}
