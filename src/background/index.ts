import * as pm from './pm'

export const initialize = async () => {
  console.log('Background initialized')

  // -----

  const processHandle = pm.createProcessHandle({
    command: 'bash',
    args: ['test/loop.sh'],
  })

  pm.startProcess(processHandle)

  console.log('process pid = ', processHandle.process && processHandle.process.pid)

  processHandle.process && processHandle.process.stdout.on('data', (data) => {
    console.log('[stdout]', data.toString())
  })

  processHandle.process && processHandle.process.stderr.on('data', (data) => {
    console.log('[stderr]', data.toString())
  })

  processHandle.process && processHandle.process.on('close', (code, signal) => {
    console.log('[process-close]', code, signal)
  })

  // -----
}

export const terminate = async () => {
  pm.killAllProcesses()
  console.log('Background terminated')
}
