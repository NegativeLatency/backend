import { execFile } from "child_process"
import * as RTMP from "../src/servers/rtmp-server"
import * as fs from "fs"
import { FramesMonitor } from 'video-quality-tools'

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

const startServer = async () => {
    const instance = RTMP.defaults()
    instance.run();
    sleep(1000)
    return instance;
}

const startStream = async (fileName: string) => {
    const url = "rtmp://localhost/live/test";
    shellAsync(`ffmpeg -re -i ${fileName} -c copy -f flv ${url}`);
    await sleep(100);
    return url;
}

const reciveStream = async (streamUrl: string) => {
    await shellAsync(`ffmpeg -i ${streamUrl} -acodec copy -vcodec copy dump.mp4`)
}

const main = async () => {

    const PAUSE = 100;

    const fileName = await getMedia("test.mp4", "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4");
    const nms = await startServer();

    const startTime = Date.now();

    const streamUrl = await startStream(fileName);
    const framesMonitorOptions = {
        ffprobePath: '/usr/local/bin/ffprobe',
        timeoutInMs: 2000,
        bufferMaxLengthInBytes: 100000,
        errorLevel: 'error',
        exitProcessGuardTimeoutInMs: 1000,
        analyzeDurationInMs: 9000
    };
    const framesMonitor = new FramesMonitor(framesMonitorOptions, streamUrl);
 
    const videoLatency = []
    const audioLatency = []

    framesMonitor.on('frame', frameInfo => {
        if (frameInfo.media_type == 'audio') {
            audioLatency.push(frameInfo.pkt_pts_time * 1000 - PAUSE)
        } else {
            console.log(Date.now() - startTime)
            videoLatency.push(frameInfo.pkt_pts_time * 1000 - PAUSE)
        }
    });

    framesMonitor.on('exit', () => {
        console.log(videoLatency);
        nms.server.stop();
    });
     
    framesMonitor.listen();
}

main();