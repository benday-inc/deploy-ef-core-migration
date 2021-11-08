import * as core from '@actions/core'
import * as child from 'child_process'
import path from 'path'
import * as fs from 'fs'
import which from 'which'
import * as os from 'os'

async function run(): Promise<void> {
  try {
    // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

    // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
    writeDebug(`Starting...`)
    writeDebug(`Working directory is ${process.cwd()}`)

    runLsLForDirectory(path.join(__dirname, '..'))

    writeDebug(`Reading inputs...`)

    writeDebug(`Finding location of dotnet...`)
    const dotnetLocation = which.sync('dotnet', {nothrow: true})

    if (
      !dotnetLocation ||
      dotnetLocation === null ||
      dotnetLocation.length === 0
    ) {
      core.setFailed(`Could not locate dotnet location`)
      return null
    } else {
      writeDebug(`Found dotnet at ${dotnetLocation}`)
    }

    const pathToDirectory = getInputValue('path_to_directory')
    verifyDirectory(pathToDirectory)

    const pathToEfDll = getPathToEfDll()

    const migrationsDllName = getInputValue('migrations_dll')
    const migrationsNamespace = getInputValue('migrations_namespace')
    const startupDllName = getInputValue('startup_dll')
    const dbContextClassName = getInputValue('dbcontext_class_name')

    const runtimeConfigFilename = `${path.basename(
      startupDllName,
      '.dll'
    )}.runtimeconfig.json`

    const depsJsonFilename = `${path.basename(
      startupDllName,
      '.dll'
    )}.deps.json`

    const migrationDllPath = getPathToFileAndVerifyExists(
      pathToDirectory,
      migrationsDllName
    )

    const startupDllPath = getPathToFileAndVerifyExists(
      pathToDirectory,
      startupDllName
    )

    const runtimeConfigPath = getPathToFileAndVerifyExists(
      pathToDirectory,
      runtimeConfigFilename
    )

    const depsJsonPath = getPathToFileAndVerifyExists(
      pathToDirectory,
      depsJsonFilename
    )

    deployMigrations(
      dotnetLocation,
      pathToEfDll,
      migrationsNamespace,
      dbContextClassName,
      migrationDllPath,
      startupDllPath,
      runtimeConfigPath,
      depsJsonPath,
      pathToDirectory
    )
  } catch (error) {
    if (error instanceof Error) {
      const err: Error = error

      core.error(err)
      core.setFailed(err)
    } else {
      core.error('Someting went wrong.')
      core.error(JSON.stringify(error))
      core.error(JSON.stringify(error))
      core.setFailed(JSON.stringify(error))
    }
  }
}

function runLsLForDirectory(dir: string): void {
  const commandText = `ls -lR ${dir}`

  writeDebug('Preparing to call the following command...')
  writeDebug(commandText)
  writeDebug('***')

  writeDebug('Calling command using child.execSync()...')

  const options: child.ExecSyncOptions = {
    env: process.env,
    stdio: [process.stdin, process.stdout, process.stderr]
  }

  child.execSync(commandText, options)

  writeDebug('Call to child.execSync() returned.')
}

function deployMigrations(
  dotnetToolPath: string,
  pathToEfDll: string,
  migrationsNamespace: string,
  dbContextClassName: string,
  migrationDllPath: string,
  startupDllPath: string,
  runtimeConfigPath: string,
  depsJsonPath: string,
  migrationsDirectory: string
): void {
  const pathToNuGetPackages: string = path.join(os.homedir(), '.nuget/packages')

  const commandText = `${dotnetToolPath} exec --depsfile ${depsJsonPath} --additionalprobingpath ${pathToNuGetPackages} --runtimeconfig ${runtimeConfigPath} ${pathToEfDll} database update --assembly ${migrationDllPath} --startup-assembly ${startupDllPath} --project-dir ${migrationsDirectory} --data-dir ${migrationsDirectory} --context ${dbContextClassName} --verbose --root-namespace ${migrationsNamespace}`

  writeDebug('Preparing to call dotnet ef with the following command...')
  writeDebug(commandText)
  writeDebug('***')

  // child.execSync(
  //   commandText,
  //   (error: string, stdout: string, stderr: string) => {
  //     if (error && error !== '') {
  //       core.setFailed(stderr)
  //       core.setFailed(error)
  //     } else {
  //       core.info(stdout)
  //     }
  //   }
  // )
  writeDebug('Calling command using child.execSync()...')
  // child.execSync(commandText, {stdio: 'inherit'})

  const options: child.ExecSyncOptions = {
    env: process.env,
    cwd: migrationsDirectory,
    stdio: [process.stdin, process.stdout, process.stderr]
  }

  child.execSync(commandText, options)

  writeDebug('Call to child.execSync() returned.')
}

// function asdf(): void {
//   child.exec('dir', (error: string, stdout: string, stderr: string) => {
//     console.log(stdout)
//   })
// }

function getPathToEfDll(): string {
  writeDebug('getting path to ef.dll...')

  const pathToEfDllOption1 = path.join(__dirname, 'ef.dll')
  const pathToEfDllOption2 = path.join(__dirname, '..', 'dist', 'ef.dll')

  const option1Exists = verifyFileExists(pathToEfDllOption1)
  const option2Exists = verifyFileExists(pathToEfDllOption2)

  if (option1Exists === false && option2Exists === false) {
    core.setFailed(
      `Could not locate ef.dll at expected paths: 1) ${pathToEfDllOption1} 2) ${pathToEfDllOption2}`
    )
    return null
  } else if (option1Exists === true) {
    writeDebug(`Found ef.dll at ${pathToEfDllOption1}`)
    return pathToEfDllOption1
  } else if (option2Exists === true) {
    writeDebug(`Found ef.dll at ${pathToEfDllOption2}`)
    return pathToEfDllOption2
  }
}

function writeDebug(message: string): void {
  core.debug(message)
}

function getInputValue(key: string): string {
  if (!key || key === null || key === '') {
    core.setFailed(`Attempted to read input but key was null or empty`)
  } else {
    const val = core.getInput(key)

    if (!val || val === null || val === '') {
      core.setFailed(
        `Attempted to read input for key ${key} but value was null or empty`
      )
      return null
    } else {
      writeDebug(`getInputValue(): ${key} - ${val}`)
      return val
    }
  }
}

function verifyDirectory(dirPath: string): boolean {
  if (!dirPath || dirPath === null || dirPath === '') {
    core.setFailed(
      `Attempted to verify directory path but argument was null or empty`
    )
    return false
  } else {
    if (fs.existsSync(dirPath) === false) {
      core.setFailed(`Directory ${dirPath} does not exist`)
      return false
    } else {
      writeDebug(`Directory ${dirPath} exists`)
      return true
    }
  }
}

function getPathToFileAndVerifyExists(
  dirPath: string,
  filename: string
): string {
  if (!dirPath || dirPath === null || dirPath === '') {
    core.setFailed(`Directory path argument was null or empty`)
    return null
  } else if (!filename || filename === null || filename === '') {
    core.setFailed(`File name argument was null or empty`)
    return null
  } else {
    const pathToFile = path.join(dirPath, filename)

    if (fs.existsSync(pathToFile) === false) {
      core.setFailed(`File ${pathToFile} does not exist`)
      return null
    } else {
      writeDebug(`File ${pathToFile} exists`)
      return pathToFile
    }
  }
}

function verifyFileExists(filePath: string): boolean {
  if (!filePath || filePath === null || filePath === '') {
    core.setFailed(`File path argument was null or empty`)
    return false
  } else {
    if (fs.existsSync(filePath) === false) {
      writeDebug(`File ${filePath} does not exist`)
      return false
    } else {
      writeDebug(`File ${filePath} exists`)
      return true
    }
  }
}

run()
