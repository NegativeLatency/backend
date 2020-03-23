const utils = require('./utils.test')
const rtmp = require('../dist/servers/rtmp-server')

describe('Test RTMP', async function () {
    const rtmpServer = rtmp.defaults()
    const port = rtmpServer.config.http.port

    it('test RTMP streaming', async function () {

        // run media server
        rtmp.defaults().run()
        await utils.sleep(3000)

        // push test media
        utils.shellAsync('/usr/bin/ffmpeg -re -i test.mp4 -c copy -f flv rtmp://localhost/live/test')
        await utils.sleep(2000)

        const result = await Promise.race([
            utils.shellAsync(`/usr/bin/curl -ksSL http://localhost:${port}/live/test.flv`),
            utils.sleep(2000),
        ])

        // if (!result) {
        //     console.info(result)
        //     throw Error("cannot receive streaming")
        // }

    }).timeout(10000)
})