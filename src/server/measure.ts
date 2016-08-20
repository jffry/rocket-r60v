import * as chalk from 'chalk';
import * as readline from 'readline';

import log from '../util/log';
import { escapeUnprintables } from '../util/ascii';
import { Checksum } from '../protocol/Checksum';
import { Socket } from 'net';

const DEST_HOST = '192.168.1.1';
const DEST_PORT = 1774;

(function main() {
  let argv = process.argv.slice(2);
  let command = argv[0];
  switch (command) {
    case 'idle': return guessIdleTimeout();
    default: return usage();
  }
})();

//helper: print usage and quit
function usage() {
  console.log(`
Usage:

  node measure.js <command>

Commands:

  idle - Connect but don't send data; how long until server kicks us?
`);
}

/*
If we connect to the machine, send one initial query and then stop, how long
can we idle until the machine terminates our connection?

Testing shows that this doesn't seem to be one consistent timeout, and that
instead it's however long it takes until the wifi flakes out a little bit.
*/
function guessIdleTimeout() {
  log.info('Estimating idle time...');
  let start = Date.now();

  let sock = new Socket();
  sock.setTimeout(10000);
  sock.on('data', function (data) {
    log.inbound(escapeUnprintables(data));
    if (String(data) === '*HELLO*') {
      setTimeout(function () {
        let msg = Checksum.attach('r00000001');
        log.outbound(msg);
        sock.write(msg);
      }, 100);
    }
  });
  sock.on('error', err => {
    let elapsed = Date.now() - start;
    log.info('elapsed', elapsed, 'ms');
    log.error(err);
    try {
      sock.end();
    } catch (ex) {
    }
    process.exit(1);
  });
  log.info('Connecting to %s:%s ...', DEST_HOST, DEST_PORT);
  sock.connect(DEST_PORT, DEST_HOST, function () {
    log.info('Connected');
    setInterval(() => {
      let elapsed = Date.now() - start;
      log.info('elapsed', elapsed, 'ms');
    }, 10000);
  });
}


function readByte(socket: Socket, offset: number, result: (readable: boolean, value: number)=>void) {
  //validate
  if (offset < 0 || offset > 0xffff) {
    throw new RangeError("Offset must be a 16-bit integer from 0x0000 to 0xffff, inclusive");
  }
  //encode offset as hex
  let hex = offset.toString(16).toUpperCase();
  while (hex.length < 4) hex = '0' + hex;
  //construct message
  let message = `r${hex}0001`

}
