import {MemorySlice} from '../MemorySlice';
import {Message} from './Message'
import {Checksum} from "../Checksum";
import {startsWith} from "../../util/text";

export class Step {
  static MIN_PRESSURE = 0;
  static MAX_PRESSURE = 140;
  static MIN_TIME = 0;
  static MAX_TIME = 600;

  duration:number; //deciseconds (e.g. a value of 180 here is 18.0 seconds)
  pressure:number; //decibars (e.g. a value of 90 here is 9.0 bars)

  constructor(duration:number, pressure:number) {
    this.duration = duration;
    this.pressure = pressure;
  }

  toString():string {
    return `[${this.duration / 10}s@${this.pressure / 10}b]`;
  }

}

export class PressureProfile {

  steps:Step[];

  constructor(steps:Step[]) {
    //TODO: validate steps
    this.steps = steps;
  }

  toString():string {
    return '[' + this.steps.map(String).join(',') + ']';
  }

  static DEFAULT_PROFILE_A() {
    return new PressureProfile([
      new Step(60, 40),
      new Step(180, 90),
      new Step(60, 50),
      new Step(0, 0),
      new Step(0, 0),
    ]);
  }

  static DEFAULT_PROFILE_B() {
    return new PressureProfile([
      new Step(80, 40),
      new Step(220, 90),
      new Step(0, 0),
      new Step(0, 0),
      new Step(0, 0),
    ]);
  }

  static DEFAULT_PROFILE_C() {
    return new PressureProfile([
      new Step(200, 90),
      new Step(100, 50),
      new Step(0, 0),
      new Step(0, 0),
      new Step(0, 0),
    ]);
  }

}

export enum TemperatureUnit {
  Celsius = 0,
  Fahrenheit = 1
}
export enum WaterSource {
  PlumbedIn = 0,
  Tank = 1
}

const MIN_COFFEE_TEMP_CELSIUS = 85;
const MAX_COFFEE_TEMP_CELSIUS = 115;
const MIN_COFFEE_TEMP_FAHRENHEIT = 185;
const MAX_COFFEE_TEMP_FAHRENHEIT = 239;

const MIN_STEAM_TEMP_CELSIUS = 115;
const MAX_STEAM_TEMP_CELSIUS = 125;
const MIN_STEAM_TEMP_FAHRENHEIT = 239;
const MAX_STEAM_TEMP_FAHRENHEIT = 257;

export class PIDConstants {
  proportional:number;
  integral:number;
  derivative:number;

  constructor(proportional:number, integral:number, derivative:number) {
    this.proportional = proportional;
    this.integral = integral;
    this.derivative = derivative;
  }
}

export class TimeOfDay {
  hours:number; //TODO: what is range?
  minutes:number; //0-59
  constructor(hours:number, minutes:number) {
    this.hours = hours;
    this.minutes = minutes;
  }
}

export enum DayOfWeek {
  Unknown = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  Sunday = 7
}

export enum Language {
  English = 0,
  German = 1,
  French = 2,
  Italian = 3
}

export class MachineState {
  coffeeCyclesSubtotal:number;
  coffeeCyclesTotal:number;

  pressureA:PressureProfile = PressureProfile.DEFAULT_PROFILE_A();
  pressureB:PressureProfile = PressureProfile.DEFAULT_PROFILE_B();
  pressureC:PressureProfile = PressureProfile.DEFAULT_PROFILE_C();
  activeProfile:number = 0; //0

  //misc settings
  language:Language = Language.English;
  isServiceBoilerOn:boolean = null; //false
  isMachineInStandby:boolean = null; //false
  waterSource:WaterSource = WaterSource.Tank;

  temperatureUnit:TemperatureUnit = TemperatureUnit.Celsius;
  coffeeTemperature:number = 105; //depends on temperatureUnit
  steamTemperature:number = 123; //depends on temperatureUnit
  steamCleanTime:number;

  coffeePID:PIDConstants;
  groupPID:PIDConstants;
  mysteryPID:PIDConstants;

  autoOnTime:TimeOfDay;
  autoStandbyTime:TimeOfDay;
  autoSkipDay:DayOfWeek;
}

export class BinaryFormat {

  static parse(bytes:MemorySlice) {
    let state = new MachineState();
    state.temperatureUnit = (bytes.getByte(0) === 0) ? TemperatureUnit.Celsius : TemperatureUnit.Fahrenheit;
    state.language = bytes.getByte(1); //TODO: validate?
    state.coffeeTemperature = bytes.getByte(2);
    state.steamTemperature = bytes.getByte(3);
    state.coffeePID = this.parsePIDConstants(bytes, 4); //4-5, 10-11, 16-17
    state.groupPID = this.parsePIDConstants(bytes, 6); //6-7, 12-13, 18-19
    state.mysteryPID = this.parsePIDConstants(bytes, 8); //8-9, 14-15, 20-21
    state.pressureA = this.parsePressureProfile(bytes, 22); //22-36
    state.pressureB = this.parsePressureProfile(bytes, 38); //38-52
    state.pressureC = this.parsePressureProfile(bytes, 54); //54-68
    state.waterSource = (bytes.getByte(70) === 0) ? WaterSource.PlumbedIn : WaterSource.Tank;
    state.activeProfile = bytes.getByte(71);
    state.steamCleanTime = bytes.getByte(72);
    state.isServiceBoilerOn = bytes.getBoolean(73);
    state.isMachineInStandby = bytes.getBoolean(74);
    state.coffeeCyclesSubtotal = bytes.getShort(75); //75-76
    state.coffeeCyclesTotal = bytes.getInt(77); //77-80
    state.autoOnTime = new TimeOfDay(bytes.getByte(81), bytes.getByte(82));
    state.autoStandbyTime = new TimeOfDay(bytes.getByte(83), bytes.getByte(84));
    state.autoSkipDay = bytes.getByte(85);
    return state;
  }

  static serialize(state:MachineState):MemorySlice {
    let bytes = MemorySlice.ofLength(100, 0); //100 bytes, initialized to 0
    bytes.setByte(0, state.temperatureUnit);
    bytes.setByte(1, state.language);
    bytes.setByte(2, state.coffeeTemperature);
    bytes.setByte(3, state.steamTemperature);
    this.writePIDConstants(bytes, state.coffeePID, 4);
    this.writePIDConstants(bytes, state.groupPID, 6);
    this.writePIDConstants(bytes, state.mysteryPID, 8);
    this.writePressureProfile(bytes, state.pressureA, 22);
    this.writePressureProfile(bytes, state.pressureB, 38);
    this.writePressureProfile(bytes, state.pressureC, 54);
    bytes.setByte(70, state.waterSource);
    bytes.setByte(71, state.activeProfile);
    bytes.setByte(72, state.steamCleanTime);
    bytes.setBoolean(73, state.isServiceBoilerOn);
    bytes.setBoolean(74, state.isMachineInStandby);
    bytes.setShort(75, state.coffeeCyclesSubtotal);
    bytes.setInt(77, state.coffeeCyclesTotal);
    bytes.setByte(81, state.autoOnTime.hours);
    bytes.setByte(82, state.autoOnTime.minutes);
    bytes.setByte(83, state.autoStandbyTime.hours);
    bytes.setByte(84, state.autoStandbyTime.minutes);
    bytes.setByte(85, state.autoSkipDay);
    return bytes;
  }

  static parsePIDConstants(bytes:MemorySlice, offset:number):PIDConstants {
    let p = bytes.getShort(offset);
    let i = bytes.getShort(offset + 6);
    let d = bytes.getShort(offset + 12);
    return new PIDConstants(p, i, d);
  }

  static writePIDConstants(bytes:MemorySlice, pid:PIDConstants, offset:number) {
    bytes.setShort(offset, pid.proportional);
    bytes.setShort(offset + 6, pid.integral);
    bytes.setShort(offset + 12, pid.derivative);
  }

  static parsePressureProfile(bytes:MemorySlice, offset:number):PressureProfile {
    return new PressureProfile([
      new Step(bytes.getShort(offset + 0), bytes.getByte(offset + 10)),
      new Step(bytes.getShort(offset + 2), bytes.getByte(offset + 11)),
      new Step(bytes.getShort(offset + 4), bytes.getByte(offset + 12)),
      new Step(bytes.getShort(offset + 6), bytes.getByte(offset + 13)),
      new Step(bytes.getShort(offset + 8), bytes.getByte(offset + 14)),
    ]);
  }

  static writePressureProfile(bytes:MemorySlice, profile:PressureProfile, offset:number) {
    for (let i = 0; i < 5; i++) {
      let step = profile.steps[i];
      bytes.setShort(offset + (2 * i), step.duration);
      bytes.setByte(offset + 10 + i, step.pressure);
    }
  }
}

export class MachineStateReadResult extends Message {
  state:MachineState;

  constructor(rawMessageWithChecksum:string) {
    super(rawMessageWithChecksum);

    if (!MachineStateReadResult.looksValid(rawMessageWithChecksum)) {
      throw new RangeError('Provided message does not appear to be a machine state response');
    }
    //remove the four preamble bytes
    this.state = BinaryFormat.parse(this.bytes.slice(4));

  }

  static looksValid(rawMessageWithChecksum:string):boolean {
    return Checksum.verify(rawMessageWithChecksum)
      && startsWith(rawMessageWithChecksum, 'r00000073');
  }

}
