import { ProcessDescription } from '../common/types'

export type ProcessViewData = {
  readonly description: ProcessDescription
  output: ProcessViewOutput
}

export type ProcessViewOutput = {
  lines: Array<string>
  lastUpdateTime: number
}

export const emptyProcessViewOutput = () => ({
  lines: [''],
  lastUpdateTime: 0,
})
