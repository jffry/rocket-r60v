import {ByteArray} from '../ByteArray';
import {Checksum} from '../Checksum';

export class Message {
  type:string;
  bytes:ByteArray;

  constructor(rawMessageWithChecksum:string) {
    Checksum.assertValid(rawMessageWithChecksum);
    //discard the checksum
    let msg = Checksum.extractMessage(rawMessageWithChecksum);
    //type is first character; will be 'r', 'w', or 'z' if present
    if (/^[rwz]/i.test(msg))
    {
      this.type = msg.substring(0, 1);
      this.bytes = ByteArray.deserialize(msg.substring(1));
    }
    else
    {
      this.type = null;
      this.bytes = ByteArray.deserialize(msg);
    }
  }

  serialize():string {
    let msg = (this.type || '') + this.bytes.serialize();
    return Checksum.attach(msg);
  }
}
