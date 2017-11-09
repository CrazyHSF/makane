import { Component, Input, Output, EventEmitter } from '@angular/core'

import { AppService } from './app.service'
import {
  ProcessHandle,
  ProcessStatus,
  ProcessDescription,
} from '../common/types'

export type ProcessViewRow = {
  readonly description: ProcessDescription
}

@Component({
  selector: 'processes-table',
  templateUrl: './processes-table.component.html',
  styleUrls: ['./processes-table.component.css'],
})
export class ProcessesTableComponent {

  @Input() dataset: ReadonlyArray<ProcessViewRow>

  @Input() loading: boolean

  @Input() pageIndex: number

  @Input() pageSize: number

  @Output() pageIndexChange = new EventEmitter<number>()

  @Output() pageSizeChange = new EventEmitter<number>()

  constructor(
    private service: AppService,
  ) { }

  onPageIndexChange(pageIndex: number) {
    this.pageIndexChange.emit(pageIndex)
  }

  onPageSizeChange(pageSize: number) {
    this.pageSizeChange.emit(pageSize)
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
