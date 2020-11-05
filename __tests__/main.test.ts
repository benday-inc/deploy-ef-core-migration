import * as sut from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

// shows how the runner will run a javascript action with env / stdout protocol

test('make call to deploy migrations', () => {
  const dirOption1 = '/Users/benday/Downloads/build-output'

  if (fs.existsSync(dirOption1)) {
    process.env['INPUT_PATH_TO_DIRECTORY'] = dirOption1
  } else {
    process.env['INPUT_PATH_TO_DIRECTORY'] = path.join(process.cwd(), 'actionsdemo-artifact')
  }

  process.env['INPUT_MIGRATIONS_DLL'] = 'Benday.Demo123.Api.dll'
  process.env['INPUT_MIGRATIONS_NAMESPACE'] = 'Benday.Demo123.Api'
  process.env['INPUT_STARTUP_DLL'] = 'Benday.Demo123.WebUi.dll'
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

  console.log('Calling command for system under test...')
  console.log(commandForSut)

  sut.execSync(commandForSut, options)

  console.log('Command for SUT returned.')
})
