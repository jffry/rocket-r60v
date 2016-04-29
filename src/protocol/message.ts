import * as checksum from './checksum';
import {byteToHex} from '../util/text';

export default class Message {

  bytes:number[];
  messageType:string; //'r', 'w', or rarely 'z'

  constructor(msgWithSum:string)
  {
    let parseResult = parseMessage(msgWithSum);
    this.bytes = parseResult.bytes;
    this.messageType = parseResult.type;
  }

  length():number
  {
    return this.bytes.length;
  }

  getByte(index:number):number
  {
    return this.bytes[index];
  }

  getChar(index:number):string
  {
    return String.fromCharCode(this.bytes[index]);
  }

  getShort(index:number):number
  {
    //apparently this coffee machine encodes multibyte integers as little-endian
    return (this.bytes[index + 1] << 8) + (this.bytes[index]);
  }

  getInt(index:number):number
  {
    //apparently this coffee machine encodes multibyte integers as little-endian
    return (this.bytes[index + 3] << 24)
      + (this.bytes[index + 2] << 16)
      + (this.bytes[index + 1] << 8)
      + (this.bytes[index]);
  }

  getSubstring(index:number, length:number):string
  {
    let chars = this.bytes.slice(index, index + length);
    return String.fromCharCode.apply(String, chars);
  }

  serialize():string
  {
    let hexBytes = this.bytes.map(byteToHex).join('');
    return checksum.attach(this.messageType + hexBytes);
  }

  toString():string
  {
    return `Message<${this.serialize()}>`;
  }

};

/**
 * Takes a raw message, like 'r00000073FC', verifies and discards the checksum, and then
 * extracts a sequence of bytes from the message (for example, 'r00000073FC' gets converted into
 * [0x00, 0x00, 0x00, 0x73] which is [0, 0, 0, 115] when written in decimal
 * @param msgWithSum {String}
 * @returns {Array}
 */
function parseMessage(msgWithSum)
{
  checksum.assertValid(msgWithSum);
  //cue up values to return; to be filled in later
  let parsed = {
    type: '',
    bytes: []
  };
  //strip off leading 'r', 'w', or 'z' prefix (TODO: determine what 'z' prefixes mean)
  let content = checksum.extractMessage(msgWithSum);
  if (/^[rwz]/i.test(content))
  {
    parsed.type = content.substring(0, 1);
    content = content.substring(1);
  }
  //parse hex pairs into integer values
  for (let i = 0; i < content.length; i += 2)
  {
    let hexpair = content.substring(i, i + 2);
    parsed.bytes.push(parseInt(hexpair, 16));
  }
  return parsed;
}

