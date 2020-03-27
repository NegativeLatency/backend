import { execFile } from "child_process"
import * as RTMP from "../src/servers/rtmp-server"
import * as fs from "fs"

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
    RTMP.defaults().run();
    await sleep(3000);
}

const startStream = async (fileName: string) => {
    await shellAsync(`ffmpeg -re -i ${fileName} -c copy -f flv rtmp://localhost/live/test`)
}

const main = async () => {
    const fileName = await getMedia("test.mp4", "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4");
    await startServer();
    await startStream(fileName);


}

main();