import { Component, Input, Output, EventEmitter } from '@angular/core'

import { PmService } from './pm.service'
import { ProcessViewData } from './view-types'
import { ProcessHandle, ProcessStatus } from '../common/types'

@Component({
  selector: 'processes-table',
  templateUrl: './processes-table.component.html',
  styleUrls: ['./processes-table.component.css'],
})
export class ProcessesTableComponent {
  @Input() dataset: ReadonlyArray<ProcessViewData>

  @Input() loading: boolean

  @Input() pageIndex: number

  @Input() pageSize: number

  @Output() pageIndexChange = new EventEmitter<number>()

  @Output() pageSizeChange = new EventEmitter<number>()

  constructor(private pm: PmService) {}

  onPageIndexChange(pageIndex: number) {
    this.pageIndexChange.emit(pageIndex)
  }

  onPageSizeChange(pageSize: number) {
    this.pageSizeChange.emit(pageSize)
  }

  onRemove(handle: ProcessHandle) {
    this.pm.remove(handle)
  }

  onRestart(handle: ProcessHandle) {
    this.pm.restart(handle)
  }

  onStart(handle: ProcessHandle) {
    this.pm.start(handle)
  }

  onStop(handle: ProcessHandle) {
    this.pm.stop(handle)
  }

  isOnline(status: ProcessStatus): boolean {
    const statuses: Array<ProcessStatus> = ['launching', 'online']
    return statuses.includes(status)
  }

  isOffline(status: ProcessStatus): boolean {
    const statuses: Array<ProcessStatus> = [
      'uninitialized',
      'stopping',
      'stopped',
      'errored',
    ]
    return statuses.includes(status)
  }
}
