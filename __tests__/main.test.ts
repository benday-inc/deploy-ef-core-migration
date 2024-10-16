import * as sut from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { log } from 'console'

// shows how the runner will run a javascript action with env / stdout protocol

beforeAll(() => {
  log('beforeAll()')
  const dirOption1 = '/workspaces/build-output'

  if (fs.existsSync(dirOption1)) {
    process.env['INPUT_PATH_TO_DIRECTORY'] = dirOption1
  } else {
    process.env['INPUT_PATH_TO_DIRECTORY'] = path.join(
      process.cwd(),
      'published-app'
    )
  }

  const workingDirectoryForDotnetPublish = path.join(
    process.cwd(),
    'test-app/Benday.Testing/src/Benday.Testing.Web'
  )

  // log the working directory
  log('Working directory for dotnet publish:')
  log(workingDirectoryForDotnetPublish)

  // assert that the directory exists
  expect(fs.existsSync(workingDirectoryForDotnetPublish)).toBe(true)

  // make a command line call to dotnet publish
  const commandText = `dotnet publish --configuration Debug --output ${process.env['INPUT_PATH_TO_DIRECTORY']}`
  const options: sut.ExecSyncOptions = {
    env: process.env,
    cwd: workingDirectoryForDotnetPublish,
    stdio: [process.stdin, process.stdout, process.stderr]
  }

  sut.execSync(commandText, options)
})

test('make call to deploy migrations', () => {
  const dirOption1 = '/workspaces/build-output'

  if (fs.existsSync(dirOption1)) {
    process.env['INPUT_PATH_TO_DIRECTORY'] = dirOption1
  } else {
    process.env['INPUT_PATH_TO_DIRECTORY'] = path.join(
      process.cwd(),
      'published-app'
    )
  }

  process.env['INPUT_MIGRATIONS_DLL'] = 'Benday.Testing.Api.dll'
  process.env['INPUT_MIGRATIONS_NAMESPACE'] = 'Benday.Testing.Api'
  process.env['INPUT_STARTUP_DLL'] = 'Benday.Testing.Web.dll'
  process.env['INPUT_DBCONTEXT_CLASS_NAME'] = 'MyDbContext'

  process.env['ACTIONS_RUNNER_DEBUG'] = 'true'
  process.env['RUNNER_DEBUG'] = '1'

  const systemUnderTest = path.join(__dirname, '..', 'lib', 'main.js')
  const options: sut.ExecSyncOptions = {
    env: process.env,
    stdio: [process.stdin, process.stdout, process.stderr]
  }

  // let temp = sut.execSync(`node ${systemUnderTest}`, options).toString()
  // console.log(temp)

  const commandForSut = `node ${systemUnderTest}`

  log('Calling command for system under test...')
  log(commandForSut)

  sut.execSync(commandForSut, options)

  console.log('Command for SUT returned.')
})
