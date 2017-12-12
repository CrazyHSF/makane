import { EOL } from 'os'
import * as delay from 'delay'
import { resolve } from 'path'
import * as createDebug from 'debug'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core'
import { NzMessageService, NzNotificationService } from 'ng-zorro-antd'

import { now } from '../common/time'
import { PmService } from './pm.service'
import { MessagesService } from './messages.service'
import { ProcessHandle, DeepPartial, CreateProcessOptions } from '../common/types'
import { ProcessViewData, ProcessViewOutput, emptyProcessViewOutput } from './view-types'

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

  dataset: ReadonlyArray<ProcessViewData> = []

  loading: boolean = false

  pageIndex: number = 1

  pageSize: number = 6

  isCreateModalVisible: boolean = false

  optionsForm: FormGroup

  optionsFormDefaults: DeepPartial<CreateProcessOptions> = {
    options: {
      cwd: '/',
    },
  }

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
    this.dataset = this.pm.list().map(description => ({
      description,
      output: emptyProcessViewOutput(),
    }))
  }

  buildFormGroup(): FormGroup {
    return this.formBuilder.group({
      name: [undefined, [Validators.required]],
      command: [undefined, [Validators.required]],
      cwd: [undefined, []],
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
      this.zone.run(() => {
        this.dataset = [...this.dataset, {
          description,
          output: emptyProcessViewOutput(),
        }]
      })
    })
    this.messages.processDescriptionRemoveMessages.subscribe(description => {
      this.zone.run(() => {
        this.dataset = this.dataset.filter(x =>
          x.description.handle !== description.handle
        )
        const maxPageIndex = Math.max(1, Math.ceil(this.dataset.length / this.pageSize))
        if (this.pageIndex > maxPageIndex) { this.pageIndex = maxPageIndex }
      })
    })
    this.messages.processDescriptionUpdateMessages.subscribe(description => {
      this.zone.run(() => {
        this.dataset = this.dataset.map(x =>
          x.description.handle !== description.handle ? x : { ...x, description }
        )
      })
    })
  }

  startHandlingProcessOutputMessages() {
    const selectOutput = (handle: ProcessHandle) => {
      const vd = this.dataset.find(x => x.description.handle === handle)
      return vd ? vd.output : undefined
    }
    const appendContent = (output: ProcessViewOutput, content: string) => {
      const previousLastLine = output.lines.pop()
      const newLines = content.split(EOL)
      newLines[0] = previousLastLine + newLines[0]
      output.lines.push(...newLines)
    }
    const limitLineCount = (output: ProcessViewOutput, max: number) => {
      const currentLineCount = output.lines.length
      if (currentLineCount > max) {
        const superfluousLineCount = currentLineCount - max
        output.lines.splice(0, superfluousLineCount)
      }
    }
    this.messages.processOutputMessages.subscribe(({ handle, content }) => {
      const output = selectOutput(handle)
      if (output) {
        this.zone.run(() => {
          appendContent(output, content)
          limitLineCount(output, 1000)
          output.lastUpdateTime = now()
        })
        debug('output of ph [%s] -> %o', handle, [...output.lines])
      }
    })
  }

  onTClick() {
    const options: CreateProcessOptions = {
      name: 'bash-t',
      options: {
        command: 'bash',
        arguments: [resolve(__dirname, '../..', 'test/loop.sh')],
        cwd: '/',
      },
    }
    debug('create test process: %o', options)
    this.pm.create(options)
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
          cwd: this.optionsForm.value.cwd || this.optionsFormDefaults.options!.cwd,
        },
      }
      this.notification.success(
        'Success',
        `Create process ${options.name} successfully`,
      )
      debug('create process: %o', options)
      this.pm.create(options)
      this.isCreateModalVisible = false
    }
  }

  onSaveProcessesSnapshot() {
    this.messages.sendSaveProcessesSnapshotMessage()
  }

  onLoadProcessesSnapshot() {
    this.messages.sendLoadProcessesSnapshotMessage()
  }

}
