import net = require('net');
import chalk = require('chalk');

import * as log from '../util/log';
import * as ascii from '../util/ascii';
import * as checksum from '../protocol/checksum';

//parse out command line parameters
const CONFIG = loadArgs();

//prepare to launch the server
let server = net.createServer(onConnection);
log.info('listening on %s:%s', CONFIG.inbound.host, CONFIG.inbound.port);
log.info('forwarding to %s:%s', CONFIG.dest.host, CONFIG.dest.port);
server.listen(CONFIG.inbound.port, CONFIG.inbound.host);

//when inbound connection is received, set up proxy apparatus
function onConnection(src:net.Socket)
{
  log.info('new proxy local: %s:%s', src.remoteAddress, src.remotePort);
  log.info('connecting to remote: %s:%s...', CONFIG.dest.host, CONFIG.dest.port);
  //connect to remote host
  var dest = new net.Socket();
  dest.connect(CONFIG.dest.port, CONFIG.dest.host, function()
  {
    log.info('connection to remote established: %s:%s', CONFIG.dest.host, CONFIG.dest.port);

  });

  //data from remote that needs to be written to server
  src.on('data', function(data)
  {
    var checksumOK = checksum.verify(String(data));
    var checksumStatus = checksumOK ? chalk.green('✓') : chalk.bold.red('✗');
    log.outbound(checksumStatus + ' ' + ascii.escapeUnprintables(data));
    dest.write(data);
  });
  dest.on('data', function(data)
  {
    var checksumOK = checksum.verify(String(data));
    var checksumStatus = checksumOK ? chalk.green('✓') : chalk.bold.red('✗');
    log.inbound(checksumStatus + ' ' + ascii.escapeUnprintables(data));
    src.write(data);
  });

  //closing one connection will also close the other
  src.on('close', function()
  {
    log.info('proxy local disconnected: %s:%s', src.remoteAddress, src.remotePort);
    src.destroy();
    src = null;
    if (dest) dest.end();
  });
  dest.on('close', function()
  {
    log.info('proxy remote disconnected: %s:%s', CONFIG.dest.host, CONFIG.dest.port);
    dest.destroy();
    dest = null;
    if (src) src.end();
  });

  //log errors
  dest.on('error', function(err)
  {
    log.error('remote error:', err);
  });
  src.on('error', function(err)
  {
    log.error('local error:', err);
  });

}

//helper: parse command line arguments
function loadArgs()
{
  //parse out command line parameters
  let argv = process.argv.slice(2);
  let hostParts = (argv[1] || '').split(':');
  let inboundHost = '127.0.0.1';
  let inboundPort = parseInt(argv[0]);
  let destHost = hostParts[0] || '127.0.0.1';
  let destPort = parseInt(hostParts[1] || inboundHost);
  if (inboundPort && destHost)
  {
    return {
      inbound: {
        host: inboundHost,
        port: inboundPort
      },
      dest: {
        host: destHost,
        port: destPort
      }
    };
  }
  else
  {
    usage();
    process.exit(1);
  }

}

//helper: print usage and quit
function usage()
{
  console.log(`
Usage:

  node proxy.js local_port remote_host[:remote_port]
 
`);
}
