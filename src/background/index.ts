import * as pm from './pm'

export const initialize = async () => {
  console.log('Background initialized')

  // -----

  const handle = pm.createProcessHandle({
    name: 'bash-t',
    command: 'bash',
    args: ['test/loop.sh'],
  })

  pm.startProcess(handle)

  const process = pm.getProcessInstance(handle)

  if (!process) throw new Error(`Process ${handle} start failed`)

  console.log('process pid = ', process.pid)

  process.stdout.on('data', (data) => {
    console.log('[stdout]', data.toString())
  })

  process.stderr.on('data', (data) => {
    console.log('[stderr]', data.toString())
  })

  process.on('close', (code, signal) => {
    console.log('[process-close]', code, signal)
  })

  // -----
}

export const terminate = async () => {
  pm.killAllProcesses()
  console.log('Background terminated')
}
