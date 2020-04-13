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

const spectatorTests: { [key: string]: string } = {
    RTMP: 'rtmp://ADDRESS:1935/live/test',
    HTTPFLV: 'http://ADDRESS:8087/live/test.flv',
    HLS: 'http://ADDRESS:8087/live/test/index.m3u8',
    DASH: 'http://ADDRESS:8087/live/test/index.mpd',
}

const spectatorDelays: { [key: string]: number } = {
    RTMP: 3,
    HTTPFLV: 3,
    HLS: 8,
    DASH: 8,
}

let startTime = 0;

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
    return serverHost.spawn('ts-node scripts/server.ts')
}

const startStreamer = (fileName: string) => {
    return streamerHost.spawn(`ffmpeg -re -i ${fileName} -c copy -f flv rtmp://${serverHost.ip}/live/test`)
}

const startSpectator = (url: string) => {
    return spectatorHost.spawn(`ts-node scripts/spectator.ts ${url.replace(/ADDRESS/g, serverHost.ip)}`)
}

const doSpectatorTest = (key: string) => {
    const spectatorProc = startSpectator(spectatorTests[key]);
    return spectatorProc
}

const stopTest = () => {
    mn.stop()
    process.exit(0)
}

const main = async () => {

    const testingTarget = process.argv[2];
    console.info(`${testingTarget} test started`);

    // prepare file
    console.info('Preparing File')
    const fileName = await getMedia("test.mp4", "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4");
    console.info('Streaming File Prepared')

    // timestamp for streaming just started
    const serverProc = startServer();
    serverProc.on('message:ready', function () {
        console.info(`${testingTarget} Server Ready`)

        let data = [];
        const proc = doSpectatorTest(testingTarget);
        proc.on('message:ready', function (d) {
            console.info(`${testingTarget} Spectator Ready`, d)

            const streamerProc = startStreamer(fileName)
            streamerProc.on('spawn', async function () {
                setTimeout(() => proc.send('ready'), spectatorDelays[testingTarget] * 1000 + 1000)
                startTime = Date.now();
                console.info(`${testingTarget} Streamer Started`)
            })

        })
        
        proc.on('message:data', function (_data) {
	    data.push({
	        frame: _data[0],
		delay: _data[1] - (_data[0] + startTime),
		ts: _data[1]
	    });
        })

        proc.on('message:stop', function (_reason) {
            console.info(`${testingTarget} Test Completed`);
            fs.writeFileSync('spectator-tests.json', JSON.stringify({type: testingTarget, exit:_reason, data}))
            stopTest()
        })
    })
}

main()
