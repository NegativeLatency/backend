const utils = require('./utils.test')
const rtmp = require('../dist/servers/rtmp-server')

describe('Test RTMP', function () {
    const rtmpServer = rtmp.defaults()
    const port = rtmpServer.config.http.port

    it('test RTMP streaming', async function () {

        // fetch example media
        await utils.getMedia('test.mp4', 'http://iurevych.github.com/Flat-UI-videos/big_buck_bunny.mp4')

        // run media server
        rtmp.defaults().run()
        await utils.sleep(500)

        // push test media
        utils.shellAsync('/usr/bin/ffmpeg -re -i test.mp4 -c copy -f flv rtmp://localhost/live/test')
        await utils.sleep(1000)

        const result = await Promise.race([
            utils.shellAsync(`/usr/bin/curl -ksSL http://localhost:${port}/live/test.flv`),
            utils.sleep(3000),
        ])

        if (!result || !result[1] || !result[1].length) {
            throw Error("cannot receive streaming")
        }

    }).timeout(5000)
})