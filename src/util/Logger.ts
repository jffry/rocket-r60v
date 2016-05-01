import util = require('util');
import chalk = require('chalk');
import WritableStream = NodeJS.WritableStream;

//main logging levels
let printError = logPrinter('!!', chalk.red.bold, process.stderr);
let printComment = logPrinter('## ', chalk.gray, process.stdout);
let printInbound = logPrinter('<- ', chalk.cyan, process.stdout);
let printOutbound = logPrinter('-> ', chalk.magenta, process.stdout);

export class Logger {

  error(fmt:any, ...args:any[]) {
    return printError(fmt, ...args);
  }

  comment(fmt:any, ...args:any[]) {
    return printComment(fmt, ...args);
  }

  info(fmt:any, ...args:any[]) {
    return printComment(fmt, ...args);
  }

  inbound(fmt:any, ...args:any[]) {
    return printInbound(fmt, ...args);
  }

  outbound(fmt:any, ...args:any[]) {
    return printOutbound(fmt, ...args);
  }


}

//include a default logger
export default new Logger();

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
