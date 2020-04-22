import * as cp from 'child_process'
import { join } from 'path'

export function shellAsync(cmd) {
    const args = cmd.split(' ')
    const file = args.shift()
    return cp.execFile(file, args, {
        shell: false,
        cwd: join(__dirname, "/../../")
    })
}