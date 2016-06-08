import {byteToHex} from '../util/text';

/**
 * Represents a continuous slice of memory, starting at `offset` bytes.
 * Queries are based on absolute positions in RAM, and not just the index
 * in the array.  Out of bounds access will throw an error.
 */
export class MemorySlice {

  offset:number;
  bytes:number[];

  constructor(bytes:number[], offset:number = 0) {
    this.bytes = bytes.slice();
    this.offset = offset;
  }

  getByte(address:number):number {
    this.assertInbounds(address, 1);
    return this.bytes[this.toIndex(address)];
  }

  //0 = false; anything else = true
  getBoolean(address:number):boolean {
    this.assertInbounds(address, 1);
    return !!this.getByte(address);
  }

  //apparently this coffee machine encodes multibyte integers as little-endian
  getShort(address:number):number {
    this.assertInbounds(address, 2);
    return this.getByte(address) + (this.getByte(address + 1) * 0x100);
  }

  getInt(address:number):number {
    this.assertInbounds(address, 4);
    return this.getByte(address)
      + (this.getByte(address + 1) * 0x100)
      + (this.getByte(address + 2) * 0x10000)
      + (this.getByte(address + 3) * 0x1000000);
  }

  getAsciiChar(address:number):string {
    this.assertInbounds(address, 1);
    return String.fromCharCode(this.getByte(address));
  }

  getSubstring(startAddress:number, endAddress?:number):string {
    //assertInbounds is handled implicitly by this.byteSlice
    let chars = this.byteSlice(startAddress, endAddress);
    return String.fromCharCode(...chars);
  }

  //TODO: convert setters to use absolute addresses

  setByte(address:number, value:number):void {
    this.assertInbounds(address, 1);
    this.bytes[this.toIndex(address)] = value & 0xff;
  }

  setBoolean(address:number, value:boolean):void {
    this.assertInbounds(address, 1);
    this.setByte(address, value ? 1 : 0);
  }

  setShort(address:number, value:number):void {
    this.assertInbounds(address, 2);
    for (let i = 0; i < 2; i++) {
      this.setByte(address + i, value & 0xff);
      value >>= 8;
    }
  }

  setInt(address:number, value:number):void {
    this.assertInbounds(address, 4);
    for (let i = 0; i < 4; i++) {
      this.setByte(address + i, value & 0xff);
      value >>= 8;
    }
  }

  setAsciiChar(address:number, char:string):void {
    this.assertInbounds(address, 1);
    this.setByte(address, char.charCodeAt(0));
  }

  setSubstring(address:number, str:string):void {
    this.assertInbounds(address, str.length);
    for (let i = 0; i < str.length; i++) {
      this.setByte(address + i, str.charCodeAt(i));
    }
  }

  //convert abs memory address to array index in our bytes
  private toIndex(address:number):number {
    return address - this.offset;
  }

  length():number {
    return this.bytes.length;
  }

  slice(startAddress:number, endAddress?:number) {
    let bytes = this.byteSlice(startAddress, endAddress);
    return new MemorySlice(bytes, startAddress);
  }
  
  clone() {
    return new MemorySlice(this.bytes, this.offset);
  }

  private byteSlice(startAddress:number, endAddress?:number):number[] {
    let startIndex = this.toIndex(startAddress);
    if (typeof endAddress === 'number') {
      this.assertInbounds(startAddress, endAddress - startAddress);
      let endIndex = this.toIndex(endAddress);
      return this.bytes.slice(startIndex, endIndex);
    }
    else {
      this.assertInbounds(startAddress, 1);
      return this.bytes.slice(startIndex);
    }
  }

  private assertInbounds(address:number, count:number = 1):void {
    if (address < this.offset || address + count > this.offset + this.bytes.length) {
      throw new RangeError('index is out of bounds');
    }
  }

  toHexString():string {
    return this.bytes.map(byteToHex).join('');
  }

  toString():string {
    return `MemorySlice[${this.offset}:${this.toHexString()}]`;
  }

  static fromHexString(serialized:string, offset:number = 0):MemorySlice {
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
    return new MemorySlice(bytes, offset);
  }

  static ofLength(length:number, initialValue:number = 0):MemorySlice {
    let bytes = new Array(length);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = initialValue;
    }
    return new MemorySlice(bytes);
  }

  static fromBuffer(buf:Buffer):MemorySlice {
    let bytes = new Array(buf.length);
    for (let i = 0; i < buf.length; i++) {
      bytes[i] = buf[i];
    }
    return new MemorySlice(bytes);
  }

  static fromString(str:string, encoding:string = 'ascii') {
    return MemorySlice.fromBuffer(new Buffer(str, encoding));
  }

}

