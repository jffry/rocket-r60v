import util = require('util');
import chalk = require('chalk');
import WritableStream = NodeJS.WritableStream;

//main logging levels
export default {
  error: logPrinter('!! ', chalk.red.bold, process.stderr),
  comment: logPrinter('## ', chalk.gray, process.stdout),
  info: logPrinter('## ', chalk.gray, process.stdout),
  inbound: logPrinter('<- ', chalk.cyan, process.stdout),
  outbound: logPrinter('-> ', chalk.magenta, process.stdout),
};

//helper function to consolidate common code
//TODO: track previous log level and allow coalescing multiple lines together
function logPrinter(prefix:string, colorizer:Function, outputStream:WritableStream) {
  return function (fmt:any, ...args:any[]) {
    let text = util.format(fmt, ...args);
    let rendered = text.replace(/^/gm, prefix);
    let colorful = colorizer(rendered);
    outputStream.write(colorful);
    outputStream.write('\n');
  };
}
