import { isInteger, toHex, fromHex } from './number';
export { lzpad, startsWith, bytesToHex, hexToBytes };

//left-zero-pad to desired length
function lzpad(str: string, len: number): string {
  while (str.length < len) str = '0' + str;
  return str;
}

function startsWith(str: string, prefix: string) {
  return str.substring(0, prefix.length) === prefix;
}

function bytesToHex(bytes: number[]):string {
  return bytes.map((byte, index) => {
    if (!isInteger(byte) || byte < 0 || byte > 0xff) {
      throw new TypeError(`bytes[${index}] is not a valid byte (found: ${byte}`);
    }
    return toHex(byte, 2);
  }).join('');
}

function hexToBytes(hex: string):number[] {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must contain an even number of hex couplets');
  }
  let numBytes = hex.length / 2;
  let bytes = new Array(numBytes);
  for (let i = 0; i < numBytes; i++) {
    let i2 = i + i;
    var s = hex.substring(i2, i2 + 2);
    bytes[i] = fromHex(s);
    if (!isInteger(bytes[i])) {
      throw new Error(`Unable to parse byte ${JSON.stringify(s)} (byte ${i})`);
    }
  }
  return bytes;
}
