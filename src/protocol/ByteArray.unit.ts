import {ByteArray} from './ByteArray';
import {assert} from 'chai';

describe('ByteArray', function () {
  it('should work on an empty array', function () {
    let ba = new ByteArray([]);
    assert.equal(ba.length(), 0);
  });

  describe('static fromHexString()', function () {
    it('should work when parsing an empty string', function () {
      let ba = ByteArray.fromHexString('');
      assert.equal(ba.length(), 0);
    });
    it('should work when parsing a hex string', function () {
      let ba = ByteArray.fromHexString('FFCC33');
      assert.equal(ba.length(), 3);
      assert.equal(ba.getByte(0), 0xFF);
      assert.equal(ba.getByte(1), 0xCC);
      assert.equal(ba.getByte(2), 0x33);
    });
    it('should not be case sensitive', function () {
      let ba = ByteArray.fromHexString('FfcC33');
      assert.equal(ba.length(), 3);
      assert.equal(ba.getByte(0), 0xFF);
      assert.equal(ba.getByte(1), 0xCC);
      assert.equal(ba.getByte(2), 0x33);
    });
    it('should fail on string of odd length', function () {
      assert.throw(() => ByteArray.fromHexString('FFCC3'));
    });
    it('should fail on string containing non hex characters', function () {
      assert.throw(() => ByteArray.fromHexString('nothex'));
      assert.throw(() => ByteArray.fromHexString('not\n'));
    });
  });

  describe('static ofLength()', function () {
    it('should make an empty ByteArray', function () {
      let ba = ByteArray.ofLength(0);
      assert.equal(ba.length(), 0);
    });
    it('should make a simple zeroed-out ByteArray', function () {
      let ba = ByteArray.ofLength(3);
      assert.equal(ba.length(), 3);
      assert.equal(ba.getByte(0), 0);
      assert.equal(ba.getByte(1), 0);
      assert.equal(ba.getByte(2), 0);
    });
    it('should allow specifying the value to fill', function () {
      const FILL = 222;
      let ba = ByteArray.ofLength(3, FILL);
      assert.equal(ba.length(), 3);
      assert.equal(ba.getByte(0), FILL);
      assert.equal(ba.getByte(1), FILL);
      assert.equal(ba.getByte(2), FILL);
    });
  });

  describe('getByte()', function () {
    it('should retrieve the right 8-bit bytes', function () {
      let ba = new ByteArray([0xCA, 0xFE, 0xFF, 0x57]);
      assert.equal(ba.getByte(0), 0xCA);
      assert.equal(ba.getByte(1), 0xFE);
      assert.equal(ba.getByte(2), 0xFF);
      assert.equal(ba.getByte(3), 0x57);
    });
    it('should perform basic bounds checking', function () {
      let ba = ByteArray.ofLength(10);
      assert.throw(() => ba.getByte(-1));
      assert.throw(() => ba.getByte(10));
      assert.throw(() => ba.getByte(11));
    });
  });

  describe('getShort()', function () {
    it('should retrieve the right 16-bit shorts (little-endian)', function () {
      let ba = new ByteArray([0x11, 0x22, 0x33, 0x44]);
      assert.equal(ba.getShort(0), 0x2211); //little endian
      assert.equal(ba.getShort(1), 0x3322); //little endian
      assert.equal(ba.getShort(2), 0x4433); //little endian
    });
    it('should perform basic bounds checking', function () {
      let ba = ByteArray.ofLength(10);
      assert.throw(() => ba.getShort(-1));
      assert.throw(() => ba.getShort(10));
      assert.throw(() => ba.getShort(11));
    });
    it('should handle bounds checking of overflow bytes', function () {
      let ba = new ByteArray([0x11, 0x22, 0x33, 0x44]);
      assert.throw(() => ba.getShort(3));
    });
  });

  describe('getInt()', function () {
    it('should retrieve the right 32-bit ints (little-endian)', function () {
      let ba = new ByteArray([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]);
      assert.equal(ba.getInt(0), 0x44332211, '0,0x44332211'); //little endian
      assert.equal(ba.getInt(1), 0x55443322, '1,0x55443322'); //little endian
      assert.equal(ba.getInt(2), 0x66554433, '2,0x66554433'); //little endian
      assert.equal(ba.getInt(3), 0x77665544, '3,0x77665544'); //little endian
      assert.equal(ba.getInt(4), 0x88776655, '4,0x88776655'); //little endian
    });
    it('should perform basic bounds checking', function () {
      let ba = ByteArray.ofLength(10);
      assert.throw(() => ba.getInt(-1));
      assert.throw(() => ba.getInt(10));
      assert.throw(() => ba.getInt(11));
    });
    it('should handle bounds checking of overflow bytes', function () {
      let ba = new ByteArray([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88]);
      assert.throw(() => ba.getInt(5));
      assert.throw(() => ba.getInt(6));
      assert.throw(() => ba.getInt(7));
    });
  });

  describe('getAsciiChar()', function () {
    it('should return correct chars from a basic string', function () {
      let ba = ByteArray.fromString('01234', 'ascii');
      assert.equal(ba.getAsciiChar(0), '0');
      assert.equal(ba.getAsciiChar(1), '1');
      assert.equal(ba.getAsciiChar(2), '2');
      assert.equal(ba.getAsciiChar(3), '3');
      assert.equal(ba.getAsciiChar(4), '4');
    });
    it('should return correct chars from a string with weird unicode escapes', function () {
      let ba = ByteArray.fromString('\n\t\x14\b$', 'ascii');
      assert.equal(ba.getAsciiChar(0), '\n');
      assert.equal(ba.getAsciiChar(1), '\t');
      assert.equal(ba.getAsciiChar(2), '\x14');
      assert.equal(ba.getAsciiChar(3), '\b');
      assert.equal(ba.getAsciiChar(4), '$');
    });
    it('should ensure that index cannot be negative', function () {
      let ba = ByteArray.fromString('00000');
      assert.throw(() => ba.getSubstring(-1));
    });
    it('should ensure that index cannot exceed buffer size', function () {
      let ba = ByteArray.fromString('00000');
      assert.throw(() => ba.getSubstring(5));
      assert.throw(() => ba.getSubstring(6));
    });
  });

  describe('getString()', function () {
    const str = 'test string pls ignore';
    it('should work on a basic string', function () {
      let ba = ByteArray.fromString(str);
      assert.equal(ba.getSubstring(0, 4), str.substring(0, 4));
    });
    it('should work even if lastIndex is not specified', function () {
      let ba = ByteArray.fromString(str);
      assert.equal(ba.getSubstring(0), str);
    });
    it('should return empty string if firstIndex and lastIndex are equal', function () {
      let ba = ByteArray.fromString(str);
      assert.equal(ba.getSubstring(5, 5), '');
    });
    it('should ensure that start index cannot be negative', function () {
      let ba = ByteArray.fromString('00000');
      assert.throw(() => ba.getSubstring(-1));
    });
    it('should ensure that start index cannot exceed buffer size', function () {
      let ba = ByteArray.fromString('00000');
      assert.throw(() => ba.getSubstring(5));
    });
    it('should ensure that end index cannot exceed buffer size', function () {
      let ba = ByteArray.fromString('00000');
      assert.throw(() => ba.getSubstring(0, 20));
    });
  });

});
