import { remote } from 'electron'
import { Injectable } from '@angular/core'
import { PMType } from '../background/pm-type'

@Injectable()
export class PMService {

  readonly pm: PMType = remote.getGlobal('pm')

}
