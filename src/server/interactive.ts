import net = require('net');
import chalk = require('chalk');
import readline = require('readline');

import log from '../util/log';
import { escapeUnprintables } from '../util/ascii';
import { Checksum } from '../protocol/Checksum';
import Timer = NodeJS.Timer;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

//parse out command line parameters and GO
const STATUS_OK = chalk.green('✓');
const STATUS_ERR = chalk.bold.red('✗');
const CONFIG = loadArgs();
run(CONFIG.dest.host, CONFIG.dest.port);

function allowSending(message:string):boolean {
  //TODO: in future, validate writes as well?
  //TODO: probably should disallow zero-byte reads?
  return /^r([0-9A-F]{2}){4}$/.test(message)
  || /^w([0-9A-F]{2}){4,}$/.test(message);
}

function prettyPrint(message:string):string {
  //message = String(message);
  let parts = /^(.)(....)(....)(.*)(..)$/i.exec(message);
  return parts ? parts.slice(1).filter(s=>s).join(' ') : message;
}

function shouldQuit(message:string) {
  switch (message.toLowerCase()) {
    case "quit":
    case "exit":
    case "leave":
    case "end":
    case "bye":
    case "q":
      return true;
    default:
      return false;
  }
}

function run(destHost, destPort):void {

  let waitingForRemote = true;

  function promptCommand() {
    waitingForRemote = false;
    rl.question('? ', function (message:string) {
      if (shouldQuit(message)) {
        try{ sock.end(); } catch(ex) {}
        process.exit(0);
      }
      //protect the user a little bit
      if (!allowSending(message)) {
        log.error('Invalid command');
        return promptCommand();
      }
      message = Checksum.attach(message);
      log.outbound(STATUS_OK, prettyPrint(message));
      sock.write(message);
      waitingForRemote = true;
    });
  }

  let sock = new net.Socket();
  process.on('exit', terminate);
  process.on('SIGINT', terminate);
  process.on('SIGTERM', terminate);
  function terminate() {
    log.info('Terminating connection...');
    try { sock.end(); sock.destroy(); } catch(ex) {}
    sock = null;
  }
  //show what the server sends
  let bufferData:Buffer[] = [];
  let bufferTimeout:NodeJS.Timer = null;
  const BUFFER_WAIT = 200; //ms
  sock.on('data', function (data) {
    bufferData.push(data);
    log.comment('read', data.length, 'bytes...');
    if (bufferTimeout) clearTimeout(bufferTimeout);
    bufferTimeout = setTimeout(onBufferComplete, BUFFER_WAIT);
  });
  function onBufferComplete() {
    let data = Buffer.concat(bufferData).toString();
    bufferTimeout = null;
    bufferData = [];
    //verify
    let checksumOK = Checksum.verify(data);
    let checksumStatus = checksumOK ? STATUS_OK : STATUS_ERR;
    log.inbound(checksumStatus, escapeUnprintables(prettyPrint(data)));
    if (waitingForRemote) {
      promptCommand();
    }
  }

  //log errors
  sock.on('error', function (err) {
    log.error('remote error:');
    log.error(err);
    try { sock.end(); } catch(ex){}
    process.exit(1);
  });
  log.info('connecting to remote: %s:%s...', destHost, destPort);
  sock.connect(destPort, destHost, function () {
    log.info('connection to remote established: %s:%s', destHost, destPort);
  });
}

//helper: parse command line arguments
function loadArgs() {
  //parse out command line parameters
  let argv = process.argv.slice(2);
  let hostParts = (argv[0] || '').split(':');
  let destHost = hostParts[0] || null;
  let destPort = parseInt(hostParts[1]) || 1774;
  if (destHost && destPort) {
    return {
      dest: {
        host: destHost,
        port: destPort
      }
    };
  }
  else {
    usage();
    process.exit(1);
  }

}

//helper: print usage and quit
function usage() {
  console.log(`
Usage:

  node interactive.js remote_host[:remote_port]
 
`);
}
