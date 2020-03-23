import * as NMS from 'node-media-server'
import { defaultNMSConfig } from '../utils/configs'
import { Server } from './interfaces'

export class RTMPServer implements Server {

    config = {}
    server = null

    constructor(config={}) {
        this.config = config
        this.server = new NMS(config)
    }

    run() {
        this.server.run()
    }

}

export function defaults() {
    return new RTMPServer(defaultNMSConfig())
}