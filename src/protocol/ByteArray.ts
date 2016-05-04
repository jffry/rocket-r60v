import {Checksum} from './Checksum';
import {byteToHex} from '../util/text';

export class ByteArray {

  bytes:number[];

  constructor(bytes:number[]) {
    this.bytes = bytes.slice();
  }

  length():number {
    return this.bytes.length;
  }

  slice(start:number, end?:number) {
    return new ByteArray(this.bytes.slice(start, end));
  }

  private assertInbounds(index:number, count:number = 1):void {
    if (index < 0 || index + count > this.bytes.length) {
      throw new RangeError('index is out of bounds');
    }
  }

  //0 = false; anything else = true
  getBoolean(index:number):boolean {
    this.assertInbounds(index, 1);
    return !!this.bytes[index];
  }

  getByte(index:number):number {
    this.assertInbounds(index, 1);
    return this.bytes[index];
  }

  //apparently this coffee machine encodes multibyte integers as little-endian
  getShort(index:number):number {
    this.assertInbounds(index, 2);
    return this.bytes[index] + (this.bytes[index + 1] * 0x100);
  }

  getInt(index:number):number {
    this.assertInbounds(index, 4);
    //TODO: figure out why bitshifting doesn't work right
    return this.bytes[index]
      + (this.bytes[index + 1] * 0x100)
      + (this.bytes[index + 2] * 0x10000)
      + (this.bytes[index + 3] * 0x1000000);
  }

  getAsciiChar(index:number):string {
    this.assertInbounds(index, 1);
    return String.fromCharCode(this.bytes[index]);
  }

  getSubstring(index:number, end?:number):string {
    if (typeof end === 'number') {
      this.assertInbounds(index, end - index);
    }
    else {
      this.assertInbounds(index, 1);
    }
    let charCodes = this.bytes.slice(index, end);
    return String.fromCharCode(...charCodes);
  }

  setBoolean(index:number, value:boolean) {
    this.assertInbounds(index, 1);
    this.bytes[index] = value ? 1 : 0;
  }

  setByte(index:number, value:number):void {
    this.assertInbounds(index, 1);
    this.bytes[index] = value & 0xff;
  }

  setShort(index:number, value:number):void {
    this.assertInbounds(index, 2);
    for (let i = 0; i < 2; i++) {
      this.bytes[index + i] = value & 0xff;
      value >>= 8;
    }
  }

  setInt(index:number, value:number):void {
    this.assertInbounds(index, 4);
    for (let i = 0; i < 4; i++) {
      this.bytes[index + i] = value & 0xff;
      value >>= 8;
    }
  }

  setAsciiChar(index:number, char:string):void {
    this.assertInbounds(index, 1);
    this.bytes[index] = char.charCodeAt(0);
  }

  setSubstring(index:number, str:string):void {
    for (let i = 0; i < str.length; i++) {
      this.bytes[index + i] = str.charCodeAt(i);
    }
  }

  toHexString():string {
    return this.bytes.map(byteToHex).join('');
  }

  toString():string {
    return `ByteArray[${this.toHexString()}]`;
  }

  static fromHexString(serialized:string):ByteArray {
    //we must contain an even number of hex couplets otherwise it's malformed
    if (serialized.length % 2 !== 0) {
      throw new RangeError('serialized form must have an even length');
    }
    let byteCount = serialized.length / 2;
    let bytes = new Array(byteCount);
    for (let i = 0; i < byteCount; i++) {
      let n = i + i; //index into string array of bytes
      let hexPair = serialized.substring(n, n + 2);
      //we expect only hex characters
      if (/[^A-Fa-f0-9]/.test(hexPair)) {
        throw new RangeError('found illegal value: ' + JSON.stringify(hexPair) + '; expected hex characters');
      }
      bytes[i] = parseInt(hexPair, 16);
    }
    return new ByteArray(bytes);
  }

  static ofLength(length:number, initialValue:number = 0):ByteArray {
    let bytes = new Array(length);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = initialValue;
    }
    return new ByteArray(bytes);
  }

  static fromBuffer(buf:Buffer):ByteArray {
    let bytes = new Array(buf.length);
    for (let i = 0; i < buf.length; i++) {
      bytes[i] = buf[i];
    }
    return new ByteArray(bytes);
  }

  static fromString(str:string, encoding:string = 'ascii') {
    return ByteArray.fromBuffer(new Buffer(str, encoding));
  }

}

