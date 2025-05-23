import { exec } from 'child_process'
import util from 'util'

const execAsync = util.promisify(exec)

export default async function killPort(port: number, method: 'tcp' | 'udp' = 'tcp') {
  if (!Number.isInteger(port)) {
    throw new Error('Invalid port number provided')
  }

  if (process.platform === 'win32') {
    const { stdout } = await execAsync('netstat -nao')
    const lines = stdout.split('\n')
    const regex = new RegExp(`^ *${method.toUpperCase()} *[^ ]*:${port} .*LISTEN`, 'i')
    const pids = lines
      .filter(line => line.match(regex))
      .map(line => {
        const parts = line.trim().split(/\s+/)
        return parts[parts.length - 1]
      })
      .filter((pid, i, arr) => pid && arr.indexOf(pid) === i)

    if (pids.length > 0) {
      await execAsync(`taskkill /F ${pids.map(pid => `/PID ${pid}`).join(' ')}`)
    }
  } else {
    const { stdout } = await execAsync(`lsof -i${method === 'tcp' ? '' : ' udp'}:${port} -s${method.toUpperCase() === 'TCP' ? 'TCP:LISTEN' : ''}`)
    const lines = stdout.split('\n').filter(Boolean)
    const pids = lines
      .map(line => line.trim().split(/\s+/)[1])
      .filter((pid, i, arr) => pid && arr.indexOf(pid) === i)

    if (pids.length > 0) {
      await execAsync(`kill -9 ${pids.join(' ')}`)
    } else {
      throw new Error('No process running on port')
    }
  }
}
