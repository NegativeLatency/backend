import * as fs from 'fs';

const ffmpeg = fs.existsSync('/usr/bin/ffmpeg')
    ? '/usr/bin/ffmpeg'
    : '/usr/local/bin/ffmpeg';

/* eslint-disable */
export const defaultNMSConfig = (rtmp=1935, http=8087, http2=8088) => ({
    // logType: 4,
    rtmp: {
        port: rtmp,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: rtmp+1,
        allow_origin: '*',
        mediaroot: './media'
    },
    http1: {
        port: http
    },
    http2: {
        port: http2
    },
    http3: {},
    trans: {
        ffmpeg,
        tasks: [{
            app: 'live',
            vc: "copy",
            vcParam: [],
            ac: "aac",
            acParam: ['-ab', '64k', '-ac', '1', '-ar', '44100'],
            hls: true,
            hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
            dash: true,
            dashFlags: '[f=dash:window_size=3:extra_window_size=5]'
        }]
    }
})
