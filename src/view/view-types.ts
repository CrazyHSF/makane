import { ProcessDescription } from '../common/types'

export type ProcessViewData = {
  readonly description: ProcessDescription
  output: ProcessViewOutput,
}

export type ProcessViewOutput = {
  lines: Array<string>,
}

export const emptyProcessViewOutput = () => ({
  lines: [''],
})
