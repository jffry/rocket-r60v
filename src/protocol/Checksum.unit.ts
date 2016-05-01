import {Checksum} from './Checksum';
import {assert} from 'chai';

describe('Checksum', function () {

  describe('calculate()', function () {
    it('should calculate empty values', function () {
      assert.equal(Checksum.calculate(''), '00');
    });
    it('should handle well-known messages', function () {
      assert.equal(Checksum.calculate('r00000073'), 'FC');
      assert.equal(Checksum.calculate('rB0000050'), '09');
      assert.equal(Checksum.calculate('w00000064OK'), '9B');
    });
    it('should handle basic ASCII', function () {
      assert.equal(Checksum.calculate('Checksum calculation 1'), '33');
      assert.equal(Checksum.calculate('Checksum calculation 2'), '34');
      assert.equal(Checksum.calculate('Checksum calculation 3'), '35');
      assert.equal(Checksum.calculate('Checksum calculation 4'), '36');
      assert.equal(Checksum.calculate('Checksum calculation 5'), '37');
      assert.equal(Checksum.calculate('Checksum calculation 6'), '38');
      assert.equal(Checksum.calculate('Checksum calculation 7'), '39');
      assert.equal(Checksum.calculate('Checksum calculation 8'), '3A');
      assert.equal(Checksum.calculate('Checksum calculation 9'), '3B');
    });
    it('should be insensitive to byte order', function () {
      var components = 'abcdefghijklmnopqrstuvwxyz0123456789';
      var sum = Checksum.calculate(components);
      for (let i = 0; i < 100; i++) {
        let str = shuffle('abcdefghijklmnopqrstuvwxyz0123456789'.split('')).join('');
        assert.equal(Checksum.calculate(str), sum);
      }
    });
    it('should handle really long strings', function () {
      let input = '';
      for (let i = 0; i < 1000; i++) input += 'some-thing';
      assert.equal(Checksum.calculate(input), '78');
    });
    it('should overflow normally', function () {
      assert.equal(Checksum.calculate('checksums overflow gracefully 1'), 'F9');
      assert.equal(Checksum.calculate('checksums overflow gracefully 2'), 'FA');
      assert.equal(Checksum.calculate('checksums overflow gracefully 3'), 'FB');
      assert.equal(Checksum.calculate('checksums overflow gracefully 4'), 'FC');
      assert.equal(Checksum.calculate('checksums overflow gracefully 5'), 'FD');
      assert.equal(Checksum.calculate('checksums overflow gracefully 6'), 'FE');
      assert.equal(Checksum.calculate('checksums overflow gracefully 7'), 'FF');
      assert.equal(Checksum.calculate('checksums overflow gracefully 8'), '00');
      assert.equal(Checksum.calculate('checksums overflow gracefully 9'), '01');
    });
  });

  describe('attach()', function () {
    it('should calculate empty values', function () {
      assert.equal(Checksum.attach(''), '00');
    });
    it('should handle well-known messages', function () {
      assert.equal(Checksum.attach('r00000073'), 'r00000073FC');
      assert.equal(Checksum.attach('rB0000050'), 'rB000005009');
      assert.equal(Checksum.attach('w00000064OK'), 'w00000064OK9B');
    });
  });

  describe('verify()', function () {
    it('should handle the empty-message case', function () {
      assert.equal(Checksum.verify('00'), true);
    });
    it('should reject invalid checksums', function () {
      assert.equal(Checksum.verify('F00DS0DA33'), false);
    });
    it('should handle well-known messages', function () {
      assert.equal(Checksum.verify('r00000073FC'), true);
      assert.equal(Checksum.verify('rB000005009'), true);
      assert.equal(Checksum.verify('w00000064OK9B'), true);
      //let's tweak the checksums to be wrong
      assert.equal(Checksum.verify('r00000073FF'), false);
      assert.equal(Checksum.verify('rB0000050FF'), false);
      assert.equal(Checksum.verify('w00000064OKFF'), false);
    });
  });
});

//Fisher-Yates shuffle
function shuffle(array:any[]):any[] {
  for (let i = array.length - 1; i > 0; i -= 1) {
    let n = Math.floor((i + 1) * Math.random());
    let tmp = array[i];
    array[i] = array[n];
    array[n] = tmp;
  }
  return array;
}
