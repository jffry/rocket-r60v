import {ByteArray} from '../ByteArray';

//offsets for where individual profiles start
const OFFSET_PROFILE_A = 22;
const OFFSET_PROFILE_B = 38;
const OFFSET_PROFILE_C = 54;
//DBC offsets
const OFFSET_DBC_PART = 75;
const OFFSET_DBC_TOT = 77;

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

  static fromBytes(bytes:ByteArray, offset:number):PressureProfile {
    return new PressureProfile([
      new Step(bytes.getShort(offset + 0), bytes.getByte(offset + 10)),
      new Step(bytes.getShort(offset + 2), bytes.getByte(offset + 11)),
      new Step(bytes.getShort(offset + 4), bytes.getByte(offset + 12)),
      new Step(bytes.getShort(offset + 6), bytes.getByte(offset + 13)),
      new Step(bytes.getShort(offset + 8), bytes.getByte(offset + 14)),
    ]);
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

export class MachineState {
  countParz:number;
  countTot:number;

  pressureA:PressureProfile = PressureProfile.DEFAULT_PROFILE_A();
  pressureB:PressureProfile = PressureProfile.DEFAULT_PROFILE_B();
  pressureC:PressureProfile = PressureProfile.DEFAULT_PROFILE_C();

  constructor(bytes:ByteArray) {
    //DBCounter
    this.countParz = bytes.getShort(OFFSET_DBC_PART);
    this.countTot = bytes.getInt(OFFSET_DBC_TOT);
    //Pressure
    this.pressureA = PressureProfile.fromBytes(bytes, OFFSET_PROFILE_A);
    this.pressureB = PressureProfile.fromBytes(bytes, OFFSET_PROFILE_B);
    this.pressureC = PressureProfile.fromBytes(bytes, OFFSET_PROFILE_C);
  }

}

