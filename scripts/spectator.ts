import { FramesMonitor } from "video-quality-tools"
import * as fs from "fs"

// @ts-ignore
import * as MiniNetHost from "mininet/host"
// const MiniNetHost = { send(a, b?) {} }

let ffprobe = '/usr/bin/ffprobe'
if (!fs.existsSync(ffprobe)) {
    ffprobe = '/usr/local/bin/ffprobe'
}

const streamUrl = process.argv[2]
const framesMonitorOptions = {
    ffprobePath: ffprobe,
    timeoutInMs: 2000,
    bufferMaxLengthInBytes: 100000,
    errorLevel: 'debug',
    exitProcessGuardTimeoutInMs: 1000,
    analyzeDurationInMs: 9000
}

const main = async () => {
    MiniNetHost.send('ready', streamUrl);
}

const doTest = () => {
    const framesMonitor = new FramesMonitor(framesMonitorOptions, streamUrl)
    const videoLatency = []
    const audioLatency = []

    framesMonitor.on('frame', frameInfo => {
        // Assume stream at the same time, current video time stamp - (streaming time) should be the latency?
        const currentTime = Date.now();
        const timingData = [frameInfo.pkt_pts_time * 1000, currentTime]
        console.log(timingData)
        MiniNetHost.send('data', timingData)
        if (frameInfo.media_type == 'audio') {
            audioLatency.push(timingData)
        } else {
            videoLatency.push(timingData)
        }
    })

    framesMonitor.on('exit', reason => {
        console.log('exit', reason)
        MiniNetHost.send('stop', reason);
    })

    framesMonitor.on('error', (err) => {
        console.log(err)
        MiniNetHost.send('data', err)
    })

    framesMonitor.listen();
}

MiniNetHost.on('message:ready', () => {
    doTest()
})
// doTest()

main();
