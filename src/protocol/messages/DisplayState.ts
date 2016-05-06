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
    state.coffeeTemperature = bytes.getByte(0);
    state.steamTemperature = bytes.getByte(1);
    state.pumpPressure = bytes.getByte(2);
    state.time = new TimeOfDay(bytes.getByte(3), bytes.getByte(4));
    state.day = bytes.getByte(5);
    state.status = bytes.getByte(6);
    state.displayText = [
      bytes.getSubstring(7, 7 + 16),
      bytes.getSubstring(23, 23 + 16),
      bytes.getSubstring(39, 39 + 16),
      bytes.getSubstring(55, 55 + 16)
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
    this.state = BinaryFormat.parse(this.bytes.slice(4));

  }

  static looksValid(rawMessageWithChecksum:string):boolean {
    return Checksum.verify(rawMessageWithChecksum)
      && startsWith(rawMessageWithChecksum, 'rB0000050');
  }

}
