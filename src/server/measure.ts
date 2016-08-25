import * as chalk from 'chalk';
import * as readline from 'readline';

import log from '../util/log';
import { escapeUnprintables } from '../util/ascii';
import { Checksum } from '../protocol/Checksum';
import { Socket } from 'net';
import * as fs from 'fs';
import { Message } from '../protocol/messages/Message';

const STATUS_OK = chalk.green('✓');
const STATUS_ERR = chalk.bold.red('✗');

const DEST_HOST = '192.168.1.1';
const DEST_PORT = 1774;

(function main() {
  let argv = process.argv.slice(2);
  let command = argv[0];
  switch (command) {
    case 'idle':
      return guessIdleTimeout();
    case 'memmap':
      return memoryMap();
    default:
      return usage();
  }
})();

//helper: print usage and quit
function usage() {
  console.log(`
Usage:

  node measure.js <command>

Commands:

  idle    Connect but don't send data; how long until server kicks us?
  memmap  Map out the current memory. What can be read? What is forbidden?
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
  killOnProcessExit(sock);
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


function memoryMap() {
  log.info('Reading memory...');

  //build up the socket
  let sock = new Socket();
  sock.setTimeout(10000);
  killOnProcessExit(sock);
  sock.on('error', err => {
    log.error(err);
    process.exit(1);
  });
  log.info('Connecting to %s:%s ...', DEST_HOST, DEST_PORT);

  sock.connect(DEST_PORT, DEST_HOST, function () {
    log.info('Connected');
  });

  //wait for first *HELLO* before starting the polling
  sock.once('data', function(data) {
    if (data) data = String(data);
    log.inbound(data);
    setTimeout(pollingLoop, 150);
  });
  //polling loop

  //store succesfully-read values here
  let values:(number|null)[] = new Array(0xFFFF);
  for (let i = 0; i < values.length; i++) {
    values[i] = 0;
  }
  let offset = 0x00;
  const startTime = Date.now();
  function pollingLoop() {
    readByte(sock, offset, (readable:boolean, value?:number) => {
      log.normal('byte', to4hex(offset), readable ? STATUS_OK : STATUS_ERR, value);
      //forecast ETA
      let elapsed = Date.now() - startTime;
      let total = elapsed * (0xffff / (offset + 1));
      let remain = total - elapsed;
      log.info('progress: elapsed', Math.round(elapsed/1000), 'sec; estimated remain', Math.round(remain / 1000), 'sec');
      //write to file... occasionally
      values[offset] = readable ? value : null;
      if (offset % 0x100 === 0) {
        log.info('SAVING RESULTS TO DISK');
        fs.writeFileSync('memscan.json', JSON.stringify(values));
      }
      //next
      offset += 1;
      if (offset <= 0xffff) {
        setTimeout(pollingLoop, 150);
      } else {
        log.info('SAVING RESULTS TO DISK');
        fs.writeFileSync('memscan.json', JSON.stringify(values));
        process.exit(0);
      }
    });
  }
}

function to4hex(value:number):string {
  let hex = value.toString(16).toUpperCase();
  while (hex.length < 4) hex = '0' + hex;
  return hex;
}


function readByte(socket: Socket, offset: number, onResult: (readable: boolean, value?: number)=>void) {
  //validate
  if (offset < 0 || offset > 0xffff) {
    throw new RangeError("Offset must be a 16-bit integer from 0x0000 to 0xffff, inclusive");
  }
  //send
  socket.once('data', gotData);
  socket.once('error', gotError);
  let timeout = setTimeout(retry, 10000);
  function removeListeners() {
    socket.removeListener('data', gotData);
    socket.removeListener('error', gotError);
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  }

  let message = Checksum.attach(`r${to4hex(offset)}0001`);
  log.outbound(message);
  socket.write(message);

  function retry() {
    removeListeners();
    log.info('Retrying...');
    setImmediate(readByte, socket, offset, onResult);
  }

  function gotError(err) {
    log.error(err);
    removeListeners();
  }

  function gotData(data) {
    if (data) data = String(data);
    log.inbound(data);
    let m = null;
    try {
      m = new Message(data);
    } catch (ex) {
      log.error(ex);
      retry();
      return;
    }
    removeListeners();
    let isReadable = m.bytes.length() > 4;
    if(isReadable) {
      setImmediate(onResult, true, m.bytes.getByte(4));
    } else {
      setImmediate(onResult, false, null);
    }
  }

}

function killOnProcessExit(sock: Socket):void {
  process.on('exit', function () {
    try {
      log.info('Terminating socket...');
      sock.end();
      sock.destroy();
    } catch (ex) {
      //nop
    }
  });
}
