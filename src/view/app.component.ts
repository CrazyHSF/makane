import * as delay from 'delay'
import { Component, OnInit } from '@angular/core'

import { AppService } from './app.service'
import { ProcessDescription } from '../background/pm-types'

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
    this.service.ngOnInit()
    this.dataset = this.service.list().map(description => ({ description }))
    console.log('component initialized')
  }

  async onClick() {
    console.log('click..')

    const handle = this.service.create({
      name: 'bash-t',
      command: 'bash',
      args: ['test/loop.sh'],
    })

    await delay(1000)

    this.service.start(handle)

    await delay(5000)

    this.service.stop(handle)

    await delay(1000)

    this.service.remove(handle)
  }

}
