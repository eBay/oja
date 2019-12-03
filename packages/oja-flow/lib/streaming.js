'use strict';

/**
 * Copyright 2019 eBay Inc.
 * Author/Developer: Dmytro Semenov
 * Use of this source code is governed by an MIT-style
 * license that can be found in the LICENSE file or at
 * https://opensource.org/licenses/MIT.
**/

const Readable = require('stream').Readable;

class ReadableStream extends Readable {
    constructor(topic, emitter) {
        super({ objectMode: true });
        this.topic = topic;
        this.emitter = emitter;
        // then init, this is a first time
        emitter.on(topic, data => {
            if (this._stopped) {
                return;
            }
            if (data === undefined || data === null) {
                this._stopped = true;
            }
            if (this._paused) {
                this._buffer.push(data);
                return;
            }
            this._continue(data);
        });

        this.once('error', err => {
            this._stopped = true;
            emitter.emit(`${topic }:end`);
            emitter.emit('error', err);
        });
        this._buffer = [];
    }

    push(data) {
        if (data === null) {
            this._stopped = true;
        }

        return super.push(data);
    }

    _read() {
        this._paused = false;
        while (!this._paused && this._buffer.length) {
            this._continue(this._buffer.shift());
        }
    }

    _continue(data) {
        if (data === undefined || data === null) {
            data = null; // mark stop down the stream
            this._stopped = true;
            this.emitter.emit(`${this.topic }:end`);
        }
        this._paused = !this.push(data);
    }
}

module.exports = {
    ReadableStream
};
