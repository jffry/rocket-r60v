import {escapeUnprintables} from '../util/ascii';
import {byteToHex} from '../util/text';

export class Checksum {

  constructor() {
    throw new Error('Checksum cannot be instantiated; use its static methods instead');
  }

  /**
   * Calculate and append the checksum to the raw message
   */
  static attach(rawMessage:string):string {
    return rawMessage + Checksum.calculate(rawMessage);
  }

  /**
   * Calculates the checksum of the given raw message, returned as an
   * uppercase, two-character hex code
   */
  static calculate(rawMessage:string):string {
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
  static verify(msgWithSum:string, throwException = false):boolean {
    var message = Checksum.extractMessage(msgWithSum);
    var actualChecksum = Checksum.extractChecksum(msgWithSum);
    var expectedChecksum = Checksum.calculate(message);
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
  static assertValid(msgWithSum:string):boolean {
    return Checksum.verify(msgWithSum, true);
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Helper methods
  ////////////////////////////////////////////////////////////////////////////////

  /**
   * Given a message with appended checksum, this extracts the raw message.
   * This function does not verify the checksum.
   */
  static extractMessage(msgWithSum) {
    return msgWithSum.substring(0, msgWithSum.length - 2);
  }

  /**
   * Given a message with appended checksum, this extracts the checksum.
   * This function does not verify the checksum.
   */
  static extractChecksum(msgWithSum) {
    return msgWithSum.substring(msgWithSum.length - 2).toUpperCase();
  }

}
