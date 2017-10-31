import * as delay from 'delay'
import { Component, OnInit } from '@angular/core'

import { AppService } from './app.service'
import { ProcessDescription } from '../common/types'

export type ProcessData = {
  readonly description: ProcessDescription
}

@Component({
  selector: 'app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {

  dataset: Array<ProcessData> = []

  constructor(private service: AppService) { }

  ngOnInit() {
    this.dataset = this.service.list().map(description => ({ description }))
    this.handlingProcessDescriptionActions()
    console.log('component initialized')
  }

  handlingProcessDescriptionActions() {
    this.service.observeProcessDescriptionActions.
      filter(action => action.type === 'create').
      subscribe(({ payload: description }) => {
        this.dataset = this.dataset.concat([{ description }])
      })
    this.service.observeProcessDescriptionActions.
      filter(action => action.type === 'remove').
      subscribe(({ payload: description }) => {
        this.dataset = this.dataset.filter(d =>
          d.description.handle !== description.handle
        )
      })
    this.service.observeProcessDescriptionActions.
      filter(action => action.type === 'update').
      subscribe(({ payload: description }) => {
        this.dataset = this.dataset.map(d =>
          d.description.handle !== description.handle ? d : { ...d, description }
        )
      })
    this.service.observeProcessDescriptionActions.
      subscribe(action => {
        console.log(
          'ProcessDescriptionAction:',
          action.type, action.payload.status, action.payload,
        )
      })
  }

  async onClick() {
    console.log('clicked')

    const handle = this.service.create({
      name: 'bash-t',
      command: 'bash',
      args: ['test/loop.sh'],
    })

    await delay(1000)

    this.service.start(handle)

    // await delay(5000)

    // this.service.stop(handle)

    // await delay(1000)

    // this.service.remove(handle)
  }

}
