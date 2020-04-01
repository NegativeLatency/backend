import * as RTMP from "../src/servers/rtmp-server"

// @ts-ignore
import * as MiniNetHost from "mininet/host"

const startServer = async () => {
    const instance = RTMP.defaults()
    instance.run();
    return instance;
}

const main = async () => {
    await startServer();
    MiniNetHost.send('ready');
}

main();