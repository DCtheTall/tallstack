export function call<T>(func: (...args: any[]) => T, args: any[]): (...args: any[]) => T;

export function callWithContext<T>(thisArg: any, func: (...args: any[]) => T, args: any[]): (...args: any[]) => T;

export function recursive<T>(func: (...args: any[]) => T, thisArg: any): any;
