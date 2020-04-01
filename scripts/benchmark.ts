import { execFile } from "child_process"
import * as fs from "fs"

// @ts-ignore
import * as MiniNet from 'mininet';

const linkOpt = {
    bandwidth: 10,  // Mbps
    delay: '50ms',
    loss: 0,
    htb: true
};
const mn = MiniNet();
const sw = mn.createSwitch();
const serverHost = mn.createHost();
const spectatorHost = mn.createHost();
const streamerHost = mn.createHost();
serverHost.link(sw, linkOpt);
spectatorHost.link(sw, linkOpt);
streamerHost.link(sw, linkOpt);

// start mininet
mn.start();

const sleep = (it: number) => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), it);
    });
}

function shellAsync(cmd: string) {
    const args = cmd.split(' ')
    const file = args.shift()
    return new Promise(resolve => {
        let data = ''
        const child = execFile(file, args, {
            shell: false
        })
        child.stdout.on('data', _data => {
            data += _data
        })
        child.on('exit', (...args) => resolve([args, data]))
    })
}

async function getMedia(name: string, url: string) {
    if (fs.existsSync(name)) {
        return name
    }
    await shellAsync(`/usr/bin/curl -ksSL ${url} --output ${name}`)
    if (!fs.existsSync(name)) {
        throw new Error(`Provoking ${name} error`)
    }
    return name
}

const startServer = () => {
    return serverHost.spawn('node server.js')
}

const startSpectator = () => {
    return spectatorHost.spawn(`node spectator.js rtmp://${serverHost.ip}/live/test`)
}

const startStreamer = (fileName: string) => {
    return streamerHost.spawn(`ffmpeg -re -i ${fileName} -c copy -f flv rtmp://${serverHost.ip}/live/test`)
}

const main = async () => {

    console.info('RTMP Test Starts')
    let startTime = 0;

    // prepare file
    console.info('Preparing File')
    const fileName = await getMedia("test.mp4", "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4");
    console.info('Streaming File Prepared')

    // timestamp for streaming just started
    const serverProc = startServer();
    serverProc.on('message:ready', function () {
        console.info('RTMP Server Ready')

        const streamerProc = startStreamer(fileName)
        streamerProc.on('spawn', function () {
            startTime = Date.now();
            console.info('RTMP Streamer Started')

            const spectatorProc = startSpectator();
            spectatorProc.on('message:ready', function (d) {
                console.info('RTMP Spectator Ready', d)
            })
            
            spectatorProc.on('message:data', function (data) {
                console.log(data)
            })

            spectatorProc.on('message:stop', function () {
                console.info('RTMP Test Completed')
                mn.stop()
                process.exit(0)
            })
        })
    })
}

main()
