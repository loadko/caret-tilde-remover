export class CliError extends Error {
  public type: string
  public exitCode: number

  constructor({
    message,
    type,
    exitCode = 1
  }: {
    message: string
    type: string
    exitCode?: number
  }) {
    super(message)

    this.type = type
    this.exitCode = exitCode
  }
}
