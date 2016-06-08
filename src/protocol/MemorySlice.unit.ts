import {MemorySlice} from './MemorySlice';
import {assert} from 'chai';

describe('MemorySlice', function () {
  it('should work on an empty array', function () {
    let ba = new MemorySlice([]);
    assert.equal(ba.length(), 0);
  });

  describe('static fromHexString()', function () {
    it('should work when parsing an empty string', function () {
      let ba = MemorySlice.fromHexString('');
      assert.equal(ba.length(), 0);
    });
    it('should work when parsing a hex string', function () {
      let ba = MemorySlice.fromHexString('FFCC33');
      assert.equal(ba.length(), 3);
      assert.equal(ba.getByte(0), 0xFF);
      assert.equal(ba.getByte(1), 0xCC);
      assert.equal(ba.getByte(2), 0x33);
    });
    it('should not be case sensitive', function () {
      let ba = MemorySlice.fromHexString('FfcC33');
      assert.equal(ba.length(), 3);
      assert.equal(ba.getByte(0), 0xFF);
      assert.equal(ba.getByte(1), 0xCC);
      assert.equal(ba.getByte(2), 0x33);
    });
    it('should fail on string of odd length', function () {
      assert.throw(() => MemorySlice.fromHexString('FFCC3'));
    });
    it('should fail on string containing non hex characters', function () {
      assert.throw(() => MemorySlice.fromHexString('nothex'));
      assert.throw(() => MemorySlice.fromHexString('not\n'));
    });
  });

  describe('static ofLength()', function () {
    it('should make an empty ByteArray', function () {
      let ba = new MemorySlice([]);
      assert.equal(ba.length(), 0);
    });
    it('should make a simple zeroed-out ByteArray', function () {
      let ba = MemorySlice.ofLength(3);
      assert.equal(ba.length(), 3);
      assert.equal(ba.getByte(0), 0);
      assert.equal(ba.getByte(1), 0);
      assert.equal(ba.getByte(2), 0);
    });
    it('should allow specifying the value to fill', function () {
      const FILL = 222;
      let ba = MemorySlice.ofLength(3, FILL);
      assert.equal(ba.length(), 3);
      assert.equal(ba.getByte(0), FILL);
      assert.equal(ba.getByte(1), FILL);
      assert.equal(ba.getByte(2), FILL);
    });
  });

  describe('slice()', function () {
    it('should extract the specified range, with correct memory offset', function () {
      let ba = new MemorySlice([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 0);
      assert.equal(ba.getByte(0x01), 1);
      assert.equal(ba.getByte(0x02), 2);
      assert.equal(ba.getByte(0x05), 5);
      let va = ba.slice(0x01, 0x06);
      assert.equal(va.length(), 5);
      assert.equal(va.getByte(0x01), 1);
      assert.equal(va.getByte(0x02), 2);
      assert.equal(va.getByte(0x05), 5);
    });
    it('should grab the rest if only a start addr is specified, with correct memory offset', function () {
      let ba = new MemorySlice([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 0);
      assert.equal(ba.getByte(0x03), 3);
      assert.equal(ba.getByte(0x06), 6);
      assert.equal(ba.getByte(0x09), 9);
      let v = ba.slice(0x03);
      assert.equal(v.length(), 7);
      assert.equal(v.getByte(0x03), 3);
      assert.equal(v.getByte(0x06), 6);
      assert.equal(v.getByte(0x09), 9);
    });
  });

  describe('getBoolean()', function () {
    it('should return false if the byte value is 0', function () {
      let ba = new MemorySlice([0x00, 0x01, 0x02, 0xff]);
      assert.equal(ba.getBoolean(0), false);
    });
    it('should return true if tye byte value is not 0', function () {
      let ba = new MemorySlice([0x00, 0x01, 0x02, 0xff]);
      assert.equal(ba.getBoolean(1), true);
      assert.equal(ba.getBoolean(2), true);
      assert.equal(ba.getBoolean(3), true);
    });
    it('should perform basic bounds checking', function () {
      let ba = MemorySlice.ofLength(10);
      assert.throw(() => ba.getBoolean(-1));
      assert.throw(() => ba.getBoolean(10));
      assert.throw(() => ba.getBoolean(11));
    });
    it('should work with non-zero memory offsets', function () {
      let ba = new MemorySlice([0x00, 0x01, 0x02, 0xff], 10);
      assert.equal(ba.getBoolean(10), false);
      assert.equal(ba.getBoolean(11), true);
      assert.equal(ba.getBoolean(12), true);
      assert.equal(ba.getBoolean(13), true);
      assert.throw(() => ba.getBoolean(9));
      assert.throw(() => ba.getBoolean(14));
    });
  });

  describe('getByte()', function () {
    it('should retrieve the right 8-bit bytes', function () {
      let ba = new MemorySlice([0xCA, 0xFE, 0xFF, 0x57]);
      assert.equal(ba.getByte(0), 0xCA);
      assert.equal(ba.getByte(1), 0xFE);
      assert.equal(ba.getByte(2), 0xFF);
      assert.equal(ba.getByte(3), 0x57);
    });
    it('should perform basic bounds checking', function () {
      let ba = MemorySlice.ofLength(10);
      assert.throw(() => ba.getByte(-1));
      assert.throw(() => ba.getByte(10));
      assert.throw(() => ba.getByte(11));
    });
    it('should work with non-zero memory offsets', function () {
      let ba = new MemorySlice([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 20);
      assert.throw(() => ba.getByte(-1));
      assert.throw(() => ba.getByte(5));
      assert.equal(ba.getByte(20), 0);
      assert.equal(ba.getByte(25), 5);
      assert.equal(ba.getByte(29), 9);
      assert.throw(() => ba.getByte(30));
      assert.throw(() => ba.getByte(31));
    });
  });

  describe('getShort()', function () {
    it('should retrieve the right 16-bit shorts (little-endian)', function () {
      let ba = new MemorySlice([0x11, 0x22, 0x33, 0x44]);
      assert.equal(ba.getShort(0), 0x2211); //little endian
      assert.equal(ba.getShort(1), 0x3322); //little endian
      assert.equal(ba.getShort(2), 0x4433); //little endian
    });
    it('should perform basic bounds checking', function () {
      let ba = MemorySlice.ofLength(10);
      assert.throw(() => ba.getShort(-1));
      assert.throw(() => ba.getShort(10));
      assert.throw(() => ba.getShort(11));
    });
    it('should handle bounds checking of overflow bytes', function () {
      let ba = new MemorySlice([0x11, 0x22, 0x33, 0x44]);
      assert.throw(() => ba.getShort(3));
    });
  });

  describe('getInt()', function () {
    it('should retrieve the right 32-bit ints (little-endian)', function () {
      let ba = new MemorySlice([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]);
      assert.equal(ba.getInt(0), 0x44332211, '0,0x44332211'); //little endian
      assert.equal(ba.getInt(1), 0x55443322, '1,0x55443322'); //little endian
      assert.equal(ba.getInt(2), 0x66554433, '2,0x66554433'); //little endian
      assert.equal(ba.getInt(3), 0x77665544, '3,0x77665544'); //little endian
      assert.equal(ba.getInt(4), 0x88776655, '4,0x88776655'); //little endian
    });
    it('should perform basic bounds checking', function () {
      let ba = MemorySlice.ofLength(10);
      assert.throw(() => ba.getInt(-1));
      assert.throw(() => ba.getInt(10));
      assert.throw(() => ba.getInt(11));
    });
    it('should handle bounds checking of overflow bytes', function () {
      let ba = new MemorySlice([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]);
      assert.throw(() => ba.getInt(5));
      assert.throw(() => ba.getInt(6));
      assert.throw(() => ba.getInt(7));
    });
  });

  describe('getAsciiChar()', function () {
    it('should return correct chars from a basic string', function () {
      let ba = MemorySlice.fromString('01234', 'ascii');
      assert.equal(ba.getAsciiChar(0), '0');
      assert.equal(ba.getAsciiChar(1), '1');
      assert.equal(ba.getAsciiChar(2), '2');
      assert.equal(ba.getAsciiChar(3), '3');
      assert.equal(ba.getAsciiChar(4), '4');
    });
    it('should return correct chars from a string with weird unicode escapes', function () {
      let ba = MemorySlice.fromString('\n\t\x14\b$', 'ascii');
      assert.equal(ba.getAsciiChar(0), '\n');
      assert.equal(ba.getAsciiChar(1), '\t');
      assert.equal(ba.getAsciiChar(2), '\x14');
      assert.equal(ba.getAsciiChar(3), '\b');
      assert.equal(ba.getAsciiChar(4), '$');
    });
    it('should ensure that index cannot be negative', function () {
      let ba = MemorySlice.fromString('00000');
      assert.throw(() => ba.getSubstring(-1));
    });
    it('should ensure that index cannot exceed buffer size', function () {
      let ba = MemorySlice.fromString('00000');
      assert.throw(() => ba.getSubstring(5));
      assert.throw(() => ba.getSubstring(6));
    });
  });

  describe('getString()', function () {
    const str = 'test string pls ignore';
    it('should work on a basic string', function () {
      let ba = MemorySlice.fromString(str);
      assert.equal(ba.getSubstring(0, 4), str.substring(0, 4));
    });
    it('should work even if lastIndex is not specified', function () {
      let ba = MemorySlice.fromString(str);
      assert.equal(ba.getSubstring(0), str);
    });
    it('should return empty string if firstIndex and lastIndex are equal', function () {
      let ba = MemorySlice.fromString(str);
      assert.equal(ba.getSubstring(5, 5), '');
    });
    it('should ensure that start index cannot be negative', function () {
      let ba = MemorySlice.fromString('00000');
      assert.throw(() => ba.getSubstring(-1));
    });
    it('should ensure that start index cannot exceed buffer size', function () {
      let ba = MemorySlice.fromString('00000');
      assert.throw(() => ba.getSubstring(5));
    });
    it('should ensure that end index cannot exceed buffer size', function () {
      let ba = MemorySlice.fromString('00000');
      assert.throw(() => ba.getSubstring(0, 20));
    });
  });

});
