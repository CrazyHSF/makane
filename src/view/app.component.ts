import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {

  readonly name = 'electron-forge'

  readonly versions = process.versions

  ngOnInit() {
    console.log('component initialized')
  }

}
