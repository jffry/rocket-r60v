import util = require('util');
import chalk = require('chalk');
import WritableStream = NodeJS.WritableStream;

//main logging levels
let error = logPrinter('!!', chalk.red.bold, process.stderr);
let comment = logPrinter('## ', chalk.gray, process.stdout);
let inbound = logPrinter('<- ', chalk.cyan, process.stdout);
let outbound = logPrinter('-> ', chalk.magenta, process.stdout);

export { error, comment, inbound, outbound, comment as info};

//helper function to consolidate common code
//TODO: track previous log level and allow coalescing multiple lines together
function logPrinter(prefix:string, colorizer:Function, outputStream:WritableStream)
{
  return function(fmt: any, ...args:any[])
  {
    let text = util.format(fmt, ...args);
    let rendered = text.replace(/^/gm, prefix);
    let colorful = colorizer(rendered);
    outputStream.write(colorful);
    outputStream.write('\n');
  };
}
