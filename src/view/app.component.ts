import { Component, OnInit } from '@angular/core'
import { PMService } from './pm.service'

@Component({
  selector: 'app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {

  readonly name = 'electron-forge'

  readonly versions = process.versions

  constructor(private pmService: PMService) { }

  ngOnInit() {
    console.log('component initialized')

    // -----

    const handle = this.pmService.pm.createProcessHandle({
      name: 'bash-t',
      command: 'bash',
      args: ['test/loop.sh'],
    })

    this.pmService.pm.startProcess(handle)

    const process = this.pmService.pm.getProcessInstance(handle)

    if (!process) throw new Error(`Process ${handle} start failed`)

    console.log('process pid = ', process.pid)

    process.stdout.on('data', (data) => {
      console.log('[stdout]', data.toString())
    })

    process.stderr.on('data', (data) => {
      console.log('[stderr]', data.toString())
    })

    process.on('close', (code, signal) => {
      console.log('[process-close]', code, signal)
    })

    // -----

  }

}
