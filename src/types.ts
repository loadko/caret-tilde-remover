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
