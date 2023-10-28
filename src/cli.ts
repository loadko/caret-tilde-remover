import { existsSync as fileExists } from 'node:fs'
import { join as pathJoin } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import CliTable from 'cli-table3'
import detectJsonIndent from './detec-json-indent'

import { CliError } from './cli-error'
import {
  CliArgs,
  CliArgsObject,
  IDependency,
  IPackagesJson,
  IPackagesLockJson,
  IPackagesLockJsonPackagesDependency
} from './types'
import yargs from 'yargs'

const { name: pkgName, version: pkgVersion, description: pkgDescription } = require('../package')

const CARET_TILDE_REGEX = /^(\^|~).*/
const PACKAGE_JSON_FILE_NAME = 'package.json'
const PACKAGE_LOCK_JSON_FILE_NAME = 'package-lock.json'

const CWD = process.cwd()

const cli = yargs
  .options({
    run: {
      alias: 'r',
      description: 'Run CLI and remove caret(^) and tilde(&) from package.json'
    }
  })
  .version('version', 'Display version information', `${pkgName}@${pkgVersion}`)
  .alias('v', 'version')
  .alias('h', 'help')
  .usage(`${pkgName}@${pkgVersion} - ${pkgDescription}\n`)
  .strict()

function getPackageFilePath({ fileName }: { fileName: string }): string {
  return pathJoin(CWD, fileName)
}

async function readPackageFile<T>({
  filePath
}: {
  filePath: string
}): Promise<{ json: T; indent: number | string }> {
  if (!fileExists(filePath)) {
    throw new CliError({ message: `File path: ${filePath} not found`, type: pkgName })
  }

  try {
    const raw = await readFile(filePath, { encoding: 'utf-8' })
    const indent = detectJsonIndent(raw)

    try {
      const json = JSON.parse(raw) as T
      return { json, indent }
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

  const tableString = table.toString()
  console.log(tableString)
}

async function readPackageFiles({ updateDependencies = false }: { updateDependencies: boolean }) {
  // read files
  const packageJsonPath = getPackageFilePath({ fileName: PACKAGE_JSON_FILE_NAME })
  const packageJson = await readPackageFile<IPackagesJson>({ filePath: packageJsonPath })

  const packageLockJsonPath = getPackageFilePath({ fileName: PACKAGE_LOCK_JSON_FILE_NAME })
  const packageLockJson = await readPackageFile<IPackagesLockJson>({
    filePath: packageLockJsonPath
  })

  // search caret & tilde dependencies in package.json
  const {
    json: { dependencies = {}, devDependencies = {}, ...packageJsonData },
    indent: packageJsonIndent
  } = packageJson
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
  const {
    json: { packages: packagesDependencies }
  } = packageLockJson
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

  if (updateDependencies) {
    for (const dependency of exactDependencies) {
      const { name, exactVersion } = dependency
      if (exactVersion) dependencies[name] = exactVersion
    }

    for (const dependency of exactDevDependencies) {
      const { name, exactVersion } = dependency
      if (exactVersion) devDependencies[name] = exactVersion
    }

    // save file
    try {
      const newPackageJson = {
        ...packageJsonData,
        dependencies,
        devDependencies
      }
      const newPackageJsonString = JSON.stringify(newPackageJson, null, packageJsonIndent)

      await writeFile(packageJsonPath, newPackageJsonString, { encoding: 'utf8' })

      console.log('\nChanges applied!')
    } catch (error) {
      throw new CliError({
        message: `Error writing file path: ${packageJsonPath}`,
        type: pkgName
      })
    }
  } else {
    console.log('\nRun `ctr -r` to apply these changes')
  }
}

async function resolveArgs(args: CliArgs): Promise<CliArgsObject> {
  return typeof args.then === 'function' ? await args : args
}

async function main(args: CliArgs) {
  const options = await resolveArgs(args)
  const { run = false } = options

  await readPackageFiles({ updateDependencies: run })
}

main(cli.argv as CliArgsObject).catch((err) => {
  setTimeout(() => {
    if (err.type === pkgName) {
      console.log(err.message)
      process.exit(err.exitCode)
    }

    throw err
  }, 0)
})
