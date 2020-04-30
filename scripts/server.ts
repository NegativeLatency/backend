import * as RTMP from "../src/servers/rtmp-server"

// @ts-ignore
import * as MiniNetHost from "mininet/host"

const startServer = async () => {
    const rtmp = parseInt(process.argv[2], 10) || 1935;
    const http = parseInt(process.argv[3], 10) || 8087;
    const instance = RTMP.withPort(rtmp, http);
    delete instance.config.http2;
    delete instance.config.http3;
    instance.run();
    return instance;
}

const main = async () => {
    await startServer();
    MiniNetHost.send('ready');
}

main();