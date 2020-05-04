import * as NMS from 'node-media-server'
import { defaultNMSConfig } from '../utils/configs'
import { shellAsync } from '../utils/utils'
import { Server } from './interfaces'

import * as bodyParser from 'body-parser'
import * as cookieParser from 'cookie-parser'
import * as express from 'express'
import * as spdy from 'spdy'
import * as https from 'https'
import { readFileSync } from 'fs'
import { join } from 'path'

import * as Logger from 'node-media-server/node_core_logger';

export class RTMPServer implements Server {

    h2app: express.Express = null
    config = {} as any
    server = null
    mediaRoot = ""

    constructor(config={}) {
        this.config = config
        this.server = new NMS(config)
    }

    run() {
        this.server.run()
        if (this.config.http.mediaroot && (this.config.http2 || this.config.http1)) {
            const options = {
                key: readFileSync(__dirname + '/../../keys/privkey.pem'),
                cert: readFileSync(__dirname + '/../../keys/fullchain.pem')
            }
            this.mediaRoot = this.config.http.mediaroot;
            this.h2app = express();
            this.h2app.use(bodyParser.urlencoded({ extended: true }));
	    this.h2app.use(cookieParser());
            this.h2app.all('*', (req, res, next) => {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
                res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
                res.header("Access-Control-Allow-Credentials", "true");

		const preq = req as any;
		if (!preq.cookies || !preq.cookies.st) {
                    (res as any).cookie('st', Date.now(), { maxAge: 1000*60*60*24 });
                }

                req.method === "OPTIONS" ? res.sendStatus(200) : next();
            });
            this.h2app.use(express.static(this.mediaRoot));

            if (this.config.http1) {
                https.createServer(options, this.h2app)
                    .listen(this.config.http1.port, () => {
                        Logger.log("Start HTTPS on port:", this.config.http1.port)
                    });
            }

            if (this.config.http2) {
                spdy.createServer(options, this.h2app)
                    .listen(this.config.http2.port, (error) => {
                        if (error) {
                            console.error(error)
                        } else {
                            Logger.log("Start HTTP2 on port:", this.config.http2.port)
                        }
                    });
            }
        }
        if (this.config.http3) {
            Logger.log("Start HTTP3/Quic on port: 8089")
            const execPath = join(__dirname, '/../../quic/backend')
            Logger.log(execPath)
            shellAsync(execPath)
                .on("error", Logger.error)
                .on("data", Logger.log)
                .on("exit", Logger.log)
        }
    }

}

export function defaults() {
    return new RTMPServer(defaultNMSConfig())
}

export function withPort(rtmp=1935, http=8087, http2=8088) {
    return new RTMPServer(defaultNMSConfig(rtmp, http, http2))
}
