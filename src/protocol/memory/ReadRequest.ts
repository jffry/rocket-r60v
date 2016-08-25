import { toHex } from '../../util/number';
import { MemoryRange } from './MemoryRange';
import { Request } from './Request';
import { Checksum } from '../Checksum';

const MAX_ADDR = 0xFFFF;

export class ReadRequest implements Request {
  readonly range: MemoryRange;

  constructor(offset: number, length: number) {
    let range = new MemoryRange(offset, length);
    if (offset < 0 || offset > MAX_ADDR) {
      throw new RangeError(`offset must be between 0 and 0x${toHex(MAX_ADDR)}, inclusive`);
    }
    if (range.lastIndex() > MAX_ADDR) {
      throw new RangeError(`range is too long; cannot request bytes beyond 0x${toHex(MAX_ADDR)}`);
    }
    //TODO: conform reads to the known-allowed ranges? (0x0000 to 0x0078 and 0xB000 to 0xB04F)
    this.range = range;
  }

  serialize(): string {
    let raw = `r${toHex(this.range.offset, 4)}${toHex(this.range.length, 4)}`;
    return Checksum.attach(raw);
  }

}

