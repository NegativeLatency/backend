import { FramesMonitor } from "video-quality-tools"
import * as fs from "fs"

// @ts-ignore
import * as MiniNetHost from "mininet/host"

let ffprobe = '/usr/bin/ffprobe'
if (!fs.existsSync(ffprobe)) {
    ffprobe = '/usr/local/bin/ffprobe'
}

const framesMonitorOptions = {
    ffprobePath: ffprobe,
    timeoutInMs: 2000,
    bufferMaxLengthInBytes: 100000,
    errorLevel: 'error',
    exitProcessGuardTimeoutInMs: 1000,
    analyzeDurationInMs: 9000
}

const streamUrl = process.argv[2]
const framesMonitor = new FramesMonitor(framesMonitorOptions, streamUrl)
const videoLatency = []
const audioLatency = []

framesMonitor.on('frame', frameInfo => {
    // Assume stream at the same time, current video time stamp - (streaming time) should be the latency?
    const currentTime = Date.now();
    const timingData = [frameInfo.pkt_pts_time * 1000, currentTime]
    if (frameInfo.media_type == 'audio') {
        audioLatency.push(timingData)
    } else {
        videoLatency.push(timingData)
        MiniNetHost.send('data', timingData)
    }
})

framesMonitor.on('exit', () => {
    MiniNetHost.send('stop');
})

framesMonitor.on('error', (err) => {
    MiniNetHost.send('data', err)
})

const main = async () => {
    framesMonitor.listen();
    MiniNetHost.send('ready', streamUrl);
}

main();