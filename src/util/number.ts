export { isInteger, toHex, fromHex };

function isInteger(value: any): boolean {
  return typeof value === "number" &&
    isFinite(value) &&
    Math.floor(value) === value;
}

function toHex(value: number, length: number = 2): string {
  let hex = value.toString(16).toUpperCase();
  while (hex.length < length) hex = '0' + hex;
  return hex;
}

function fromHex(value: string): number {
  return parseInt(value, 16);
}
