import {lzpad} from './text';

export {escapeUnprintables};

/**
 * Escapes unprintable characters in a string so that it is suitable for printing out
 * to a human-readable interface (like a console screen)
 */
function escapeUnprintables(str:string):string {
  if (typeof str !== 'string') str = String(str || '');
  return str.split('').map(escapeChar).join('');
}

//char codes to escape
function escapeChar(c:string):string {
  const LUT = {
    '\\': '\\\\',
    '\0': '\\0',
    '\b': '\\b',
    '\f': '\\f',
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\v': '\\v',
    '\uFFFD': '\\uFFFD',
    '\uFEFF': '\\uFEFF',
  };

  if (c.length !== 1) throw new Error('c can only be a length-1 string');
  //first search the lookup table of "named" escapes
  if (LUT.hasOwnProperty(c)) {
    return LUT[c];
  }
  //handle unnamed escapes
  var code = c.charCodeAt(0);
  if (code < 32 || (code >= 127 && code < 256)) {
    return '\\x' + lzpad(code.toString(16), 2);
  }
  //no escape needed
  return c;
}
