import { execFile } from "child_process"
import * as fs from "fs"

// @ts-ignore
import * as MiniNet from 'mininet';

interface ILinkOpt {
    bandwidth: number,
    delay : "50ms" | "100ms",
    loss: number,
    htb: boolean
}

interface ITestSpec {
    linkOpt: ILinkOpt,
    video: string,
    spectator: number
}

// const linkOpt: ILinkOpt = {
//     bandwidth: 10,  // Mbps
//     delay: '50ms',
//     loss: 0,
//     htb: true
// };

const RTMPPort = parseInt(process.argv[3], 10) || 1935;
const HTTPPort = parseInt(process.argv[4], 10) || 8087;
const spectatorTests: { [key: string]: string } = {
    RTMP: `rtmp://ADDRESS:${RTMPPort}/live/test`,
    HTTPFLV: `http://ADDRESS:${HTTPPort}/live/test.flv`,
    HLS: `http://ADDRESS:${HTTPPort}/live/test/index.m3u8`,
    DASH: `http://ADDRESS:${HTTPPort}/live/test/index.mpd`,
}
const spectatorDelays: { [key: string]: number } = {
    RTMP: 3,
    HTTPFLV: 3,
    HLS: 8,
    DASH: 8,
}

let startTime = 0;

const createMiniNet = (linkOpt: ILinkOpt) => {
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

    return {serverHost, spectatorHost, streamerHost, mn}
}

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

const startServer = (serverHost: any) => {
    return serverHost.spawn(`ts-node scripts/server.ts ${RTMPPort} ${HTTPPort}`)
}

const startStreamer = (streamerHost: any, serverHost: any, fileName: string) => {
    return streamerHost.spawn(`ffmpeg -re -i ${fileName} -c copy -f flv rtmp://${serverHost.ip}/live/test`)
}

const startSpectator = (spectatorHost: any, serverHost: any, key: string) => {
    return spectatorHost.spawn(`ts-node scripts/spectator.ts ${spectatorTests[key].replace(/ADDRESS/g, serverHost.ip)}`)
}

const stopTest = (mn) => {
    mn.stop()
}

const startTest = async (test: ITestSpec) => {

    const {linkOpt, video, spectator} = test;
    delete linkOpt.htb;

    const testingTarget = process.argv[2];
    console.info(`${testingTarget} test started (${RTMPPort}:${HTTPPort})`);

    // prepare file
    console.info('Preparing File')
    const fileName = await getMedia("test.mp4", video)
    console.info('Streaming File Prepared')
    const {serverHost, streamerHost, spectatorHost, mn} = createMiniNet(linkOpt)
    console.info('Mininet Started')
    // timestamp for streaming just started
    const serverProc = startServer(serverHost);

    return new Promise((resolve, reject) => {
        serverProc.on('message:ready', function () {
            console.info(`${testingTarget} Server Ready`)
    
            let data = [];
            const proc = startSpectator(spectatorHost, serverHost, testingTarget);
            proc.on('message:ready', function (d) {
                console.info(`${testingTarget} Spectator Ready`, d)
    
                const streamerProc = startStreamer(streamerHost, serverHost, fileName)
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
                console.info(`${testingTarget} Test Completed`)
                const results = {config: test, type: testingTarget, exit:_reason, conditions: linkOpt ,data}
                stopTest(mn)
                resolve(results)
            });

            proc.on('error', function (err) {
                console.error(err)
            });

            proc.on('exit', function (err) {
                console.error("exit", err)
            });
        })
    });
}

const main = async () => {
    const tests: Array<ITestSpec> = JSON.parse(fs.readFileSync("./scripts/tests.json").toString())
    const results = [];
    for (let testSpec of tests) {
        results.push(await startTest(testSpec))
    }
    fs.writeFileSync('spectator-tests.json', JSON.stringify(results))
}

main()

// test(linkOpt)
