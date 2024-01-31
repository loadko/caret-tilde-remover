import { Arguments } from 'yargs'

export interface ICliFlags {
  debug?: boolean
  run?: boolean
  version?: boolean
  _: (string | number)[]
  $0: string
}

export type CliArgsObject = {
  [key in keyof Arguments<ICliFlags>]: Arguments<ICliFlags>[key]
}

export type CliArgsPromise = Promise<CliArgsObject>

export type CliArgs = CliArgsObject | CliArgsPromise

export interface IPackagesJson {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}

export interface IPackagesLockJson {
  packages: Record<string, IPackagesLockJsonPackagesDependency>
}

export interface IPackagesLockJsonPackagesDependency {
  version: string
}

export interface IDependency {
  name: string
  version: string
  exactVersion: string | undefined
}
