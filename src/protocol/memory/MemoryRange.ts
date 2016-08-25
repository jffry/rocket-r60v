import { isInteger } from '../../util/number';

export class MemoryRange {
  readonly offset: number;
  readonly length: number;

  constructor(offset: number, length: number) {
    if (!isInteger(offset)) {
      throw new RangeError('offset must be an integer');
    }
    if (offset < 0) {
      throw new RangeError('offset cannot be negative');
    }
    if (!isInteger(length)) {
      throw new RangeError('offset must be an integer');
    }
    if (length < 0) {
      throw new RangeError('length cannot be negative');
    }
    this.offset = offset;
    this.length = length;
  }

  includes(offset: number): boolean {
    return isInteger(offset)
      && offset >= this.offset
      && offset <= this.lastIndex();
  }

  lastIndex():number {
    return this.offset + this.length - 1;
  }

}
