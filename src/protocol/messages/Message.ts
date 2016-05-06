import {MemorySlice} from '../MemorySlice';
import {Checksum} from '../Checksum';

export class Message {
  type:string;
  bytes:MemorySlice;

  constructor(rawMessageWithChecksum:string) {
    Checksum.assertValid(rawMessageWithChecksum);
    //discard the checksum
    let msg = Checksum.extractMessage(rawMessageWithChecksum);
    //type is first character; will be 'r', 'w', or 'z' if present
    if (/^[rwz]/i.test(msg)) {
      this.type = msg.substring(0, 1);
      this.bytes = MemorySlice.fromHexString(msg.substring(1));
    }
    else {
      this.type = null;
      this.bytes = MemorySlice.fromHexString(msg);
    }
  }

  startsWith(bytes:MemorySlice) {
    for (let i = 0; i < bytes.length(); i++) {
      if (bytes.getByte(i) !== this.bytes.getByte(i)) {
        return false;
      }
    }

    return true;
  }

  serialize():string {
    let msg = (this.type || '') + this.bytes.toHexString();
    return Checksum.attach(msg);
  }
}
