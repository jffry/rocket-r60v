import chalk = require('chalk');
import * as checksum from './protocol/checksum';

console.log(checksum.verify("hi"));
console.log(chalk.red('hi'));
