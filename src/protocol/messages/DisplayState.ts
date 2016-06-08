import {MemorySlice} from '../MemorySlice';
import {Message} from './Message'
import {Checksum} from "../Checksum";
import {startsWith} from "../../util/text";
import {TimeOfDay, DayOfWeek} from "./MachineState";

export class DisplayState {
  coffeeTemperature:number;
  steamTemperature:number;
  pumpPressure:number;
  time:TimeOfDay;
  day:number;
  status:number;
  displayText:string[];
}

export class BinaryFormat {
  static parse(bytes:MemorySlice) {
    let state = new DisplayState();
    state.coffeeTemperature = bytes.getByte(0xB000);
    state.steamTemperature = bytes.getByte(0xB001);
    state.pumpPressure = bytes.getByte(0xB002);
    state.time = new TimeOfDay(bytes.getByte(0xB003), bytes.getByte(0xB004));
    state.day = bytes.getByte(0xB005);
    state.status = bytes.getByte(0xB006);
    state.displayText = [
      bytes.getSubstring(0xB007, 0xB017),
      bytes.getSubstring(0xB017, 0xB027),
      bytes.getSubstring(0xB027, 0xB037),
      bytes.getSubstring(0xB037, 0xB047)
    ];
    return state;
  }

}

export class DisplayStateReadResult extends Message {
  state:DisplayState;

  constructor(rawMessageWithChecksum:string) {
    super(rawMessageWithChecksum);
    if (!DisplayStateReadResult.looksValid(rawMessageWithChecksum)) {
      throw new RangeError('Provided message does not appear to be a machine state response');
    }
    //remove the four preamble bytes
    let bytes = this.bytes.slice(4); //slice off leading offset+length from message
    bytes.offset = 0xB000;
    this.state = BinaryFormat.parse(bytes);
  }

  static looksValid(rawMessageWithChecksum:string):boolean {
    return Checksum.verify(rawMessageWithChecksum)
      && startsWith(rawMessageWithChecksum, 'rB0000050');
  }

}
