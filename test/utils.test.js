const cp = require('child_process')
const fs = require('fs')

const log = (...args) => console.log('[test]', ...args)
const sleep = (t) => new Promise(rsv => setTimeout(rsv, t))

function shellAsync(cmd) {
    const args = cmd.split(' ')
    const file = args.shift()
    return new Promise(resolve => {
        let data = ''
        const child = cp.execFile(file, args, {
            shell: false
        })
        child.stdout.on('data', _data => {
            data += _data
        })
        child.on('exit', (...args) => resolve([args, data]))
    })
}

async function getMedia(name, url) {
    if (fs.existsSync(name)) {
        return name
    }
    log(`Provoking`, name)
    await shellAsync(`/usr/bin/curl -ksSL ${url} --output ${name}`)
    if (!fs.existsSync(name)) {
        throw new Error(`Provoking ${name} error`)
    }
    return name
}

module.exports = {
    log,
    sleep,
    shellAsync,
    getMedia
}