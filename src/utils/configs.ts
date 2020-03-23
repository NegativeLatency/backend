/* eslint-disable */
export const defaultNMSConfig = () => ({
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: 8087,
        allow_origin: '*'
    }
})