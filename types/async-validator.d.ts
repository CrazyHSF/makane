declare module 'async-validator' {

  type Schema = {}

  type ValidateCallback = (errors: Array<Error>, fields: Record<string, Array<Error>>) => void

  class Validator {
    constructor(schema: Schema)
    validate<A>(source: A, callback: ValidateCallback): void
  }

  export = Validator
}
