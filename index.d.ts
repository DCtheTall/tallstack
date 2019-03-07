export function call<S extends any[], T>(func: (...args: S) => T, ...args: S): T;

export function callWithContext<S extends any[], T>(
  thisArg: any,
  func: (...args: S) => T,
  ...args: S
): T;

export function recursive<S extends any[], T>(
  func: (...args: S) => T,
  thisArg?: any,
): (...args: S) => T;
