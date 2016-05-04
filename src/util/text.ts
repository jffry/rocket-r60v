export {lzpad, byteToHex, startsWith};

//left-zero-pad to desired length
function lzpad(str:string, len:number):string {
  while (str.length < len) str = '0' + str;
  return str;
}

/**
 * Converts an integer from 0-255 into an uppercased two-digit hex representation
 */
function byteToHex(byteValue:number):string {
  let hex = byteValue.toString(16).toUpperCase();
  while (hex.length < 2) hex = '0' + hex;
  return hex;
}

function startsWith(str:string, prefix:string) {
  return str.substring(0, prefix.length) === prefix;
}
