import {escapeUnprintables} from '../util/ascii';
import {byteToHex} from '../util/text';

export {
  attach,
  calculate,
  verify,
  assertValid,
  extractChecksum,
  extractMessage
}

/**
 * Calculate and append the checksum to the raw message
 */
function attach(rawMessage:string):string {
  return rawMessage + calculate(rawMessage);
}

/**
 * Calculates the checksum of the given raw message, returned as an
 * uppercase, two-character hex code
 */
function calculate(rawMessage:string):string {
  let sum = 0;
  if (rawMessage) {
    for (let i = 0; i < rawMessage.length; i++) {
      sum += rawMessage.charCodeAt(i);
    }
    sum = sum & 255;
  }
  return byteToHex(sum);
}

/**
 * Given a message with attached checksum (e.g. 'r00000073FC', where 'r00000073' is the message
 * and its checksum 'FC' has been appended), this method verifies that the checksum is correct.
 * If `throwException` is true, then this method will throw an informative execption if the
 * checksum turns out not to be valid.
 */
function verify(msgWithSum:string, throwException = false):boolean {
  var message = extractMessage(msgWithSum);
  var actualChecksum = extractChecksum(msgWithSum);
  var expectedChecksum = calculate(message);
  var isValid = (expectedChecksum === actualChecksum);
  if (!isValid && throwException) {
    let truncatedMessage = escapeUnprintables(msgWithSum.substring(0, 9) + (msgWithSum.length > 9 ? '...' : ''));
    let errorDetail = `Invalid checksum; expected "${expectedChecksum}", found "${actualChecksum}" in message "${truncatedMessage}"`;
    throw new Error(errorDetail);
  }
  else {
    return isValid;
  }
}

/**
 * Given a message with attached checksum (e.g. 'r00000073FC', where 'r00000073' is the message
 * and its checksum 'FC' has been appended), this method verifies that the checksum is correct.
 * It will do nothing if the checksum is OK, but it will throw an exception upon any problems.
 */
function assertValid(msgWithSum:string):boolean {
  return verify(msgWithSum, true);
}

////////////////////////////////////////////////////////////////////////////////
// Helper methods
////////////////////////////////////////////////////////////////////////////////

/**
 * Given a message with appended checksum, this extracts the raw message.
 * This function does not verify the checksum.
 */
function extractMessage(msgWithSum) {
  return msgWithSum.substring(0, msgWithSum.length - 2);
}

/**
 * Given a message with appended checksum, this extracts the checksum.
 * This function does not verify the checksum.
 */
function extractChecksum(msgWithSum) {
  return msgWithSum.substring(msgWithSum.length - 2).toUpperCase();
}

