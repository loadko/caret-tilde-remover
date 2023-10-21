import { existsSync as fileExists } from 'node:fs'
import { join as pathJoin } from 'node:path'
import { readFile } from 'node:fs/promises'
import CliTable from 'cli-table3'

import { CliError } from './cli-error'
import {
  IDependency,
  IPackagesJson,
  IPackagesLockJson,
  IPackagesLockJsonPackagesDependency
} from './types'

const { name: pkgName } = require('../package')

const CARET_TILDE_REGEX = /^(\^|~).*/
const PACKAGE_JSON_FILE_NAME = 'package.json'
const PACKAGE_LOCK_JSON_FILE_NAME = 'package-lock.json'

const CWD = process.cwd()

async function readPackageFile<T>({ fileName }: { fileName: string }): Promise<T> {
  const filePath = pathJoin(CWD, fileName)

  if (!fileExists(filePath)) {
    throw new CliError({ message: `File path: ${filePath} not found`, type: pkgName })
  }

  try {
    const raw = await readFile(filePath, { encoding: 'utf-8' })

    try {
      return JSON.parse(raw) as T
    } catch (err) {
      throw new CliError({ message: `Error parsing file path: ${filePath}`, type: pkgName })
    }
  } catch (err) {
    throw new CliError({ message: `Error reading file path: ${filePath}`, type: pkgName })
  }
}

function getCaretTildeDependencies({
  dependencies = {}
}: {
  dependencies: Record<string, string>
}): Record<string, string> {
  const carteTildeDependenciesEntries = Object.entries(dependencies).filter(([_, version]) =>
    CARET_TILDE_REGEX.test(version)
  )

  return Object.fromEntries(carteTildeDependenciesEntries)
}

function searchExactDependencies({
  packagesDependencies = {},
  toSearchDependencies = {}
}: {
  packagesDependencies: Record<string, IPackagesLockJsonPackagesDependency>
  toSearchDependencies: Record<string, string>
}): IDependency[] {
  const dependencies: IDependency[] = []
  const packagesDependenciesEntries = Object.entries(packagesDependencies)

  Object.entries(toSearchDependencies).forEach(([dependency, version]) => {
    const packagesDependency = packagesDependenciesEntries.find(
      ([packagesDependencyKey, _]) => packagesDependencyKey === `node_modules/${dependency}`
    )
    const packagesDependencyVersion = packagesDependency ? packagesDependency[1].version : undefined

    dependencies.push({
      name: dependency,
      version,
      exactVersion: packagesDependencyVersion
    })
  })

  return dependencies
}

function logDependencyTable({
  header,
  dependencies = []
}: {
  header: string
  dependencies: IDependency[]
}) {
  console.log(`\n\t${header}`)

  const table = new CliTable({
    head: [],
    chars: {
      top: '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      bottom: '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      left: '',
      'left-mid': '',
      mid: '',
      'mid-mid': '',
      right: '',
      'right-mid': '',
      middle: ''
    }
  })

  for (const dependency of dependencies) {
    const { name, version, exactVersion } = dependency

    const cells = [name, version, '\u2192', exactVersion]
    table.push(cells)
  }

  console.log(table.toString())
}

async function readPackageFiles() {
  // read files
  const packageJson = await readPackageFile<IPackagesJson>({ fileName: PACKAGE_JSON_FILE_NAME })
  const packageLockJson = await readPackageFile<IPackagesLockJson>({
    fileName: PACKAGE_LOCK_JSON_FILE_NAME
  })

  // search caret & tilde dependencies in package.json
  const { dependencies = {}, devDependencies = {} } = packageJson
  const caretTildeDependencies = getCaretTildeDependencies({ dependencies })
  const caretTildeDevDependencies = getCaretTildeDependencies({ dependencies: devDependencies })

  if (
    !Object.keys(caretTildeDependencies).length ||
    !Object.keys(caretTildeDevDependencies).length
  ) {
    throw new CliError({
      message: `There isn't any dependency with caret(^) or tilde(~)`,
      type: pkgName
    })
  }

  // search dependencies in package-lock.json
  const { packages: packagesDependencies } = packageLockJson
  const exactDependencies = searchExactDependencies({
    packagesDependencies,
    toSearchDependencies: caretTildeDependencies
  })
  const exactDevDependencies = searchExactDependencies({
    packagesDependencies,
    toSearchDependencies: caretTildeDevDependencies
  })

  logDependencyTable({ header: 'dependencies', dependencies: exactDependencies })
  logDependencyTable({ header: 'devDependencies', dependencies: exactDevDependencies })
}

async function main() {
  await readPackageFiles()
}

main().catch((err) => {
  setTimeout(() => {
    if (err.type === pkgName) {
      console.log(err.message)
      process.exit(err.exitCode)
    }

    throw err
  }, 0)
})
