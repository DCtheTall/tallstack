/*

This library is an implementation of a call stack in JS which allows
you to define recursive functions which avoid stack overflow.

It does so by reimplementing a simplified version of the callstack in
javascript that is then evaluated iteratively in applicative order.

--------------------
Author: Dylan Cutler
License: Apache-2.0
Copyright: February, 2019

*/

"use strict";

const NULL = Symbol('null');
const RETURNED = Symbol('ret');

const originalFunctionMap = new WeakMap();

/**
 * @param {Map} memory
 * @param {any[]} args
 * @return {any}
 */
function retrieveFromMemory(memory, args) {
    let tmp = memory;
    const L = args.length;
    for (let i = 0; i < L; i++) {
        const arg = args[i];
        tmp = tmp.get(arg);
        if (!tmp) {
            return NULL;
        }
    }
    return tmp.get(RETURNED);
}

/**
 * @param {Map} memory
 * @param {any[]} args
 * @param {any} value
 */
function cacheResultInMemory(memory, args, value) {
    let tmp = memory;
    const L = args.length;
    for (let i = 0; i < L; i++) {
        const arg = args[i];
        const next = memo.get(arg);
        if (next) {
            tmp = next;
            continue;
        }
        const newMemory = new Map();
        newMemory.set(RETURNED, NULL);
        tmp.set(arg, newMemory);
        tmp = newMemory;
    }
    tmp.set(RETURNED, value);
}

class StackFrame {
    constructor(func, args) {
        this.func = func;
        this.args = args;
        this.context = NULL;
        this.parent = NULL;
        this.numberOfPendingArguments = 0;

        const L = this.args.length;
        for (let i = 0; i < L; i++) {
            const arg = this.args[i];
            if (!(arg instanceof StackFrame)) continue;
            arg.parent = this;
            arg.parentArgIndex = i;
            this.numberOfPendingArguments++;
        }
    }

    setContext(thisArg) {
        this.context = thisArg;
        return this;
    }

    pushUnevaluatedArguments(stack) {
        const L = this.args.length;
        for (let i = 0; i < L; i++) {
            const arg = this.args[i];
            if (arg instanceof StackFrame) {
                stack.push(arg);
            }
        }
    }

    evaluate() {
        const func = originalFunctionMap.get(this.func) || this.func;
        const result = func.apply(this.context, this.args);

        if (this.parent === NULL) {
            return result;
        }

        if (result instanceof StackFrame) {
            result.parent = this.parent;
            result.parentArgIndex = this.parentArgIndex;
        } else {
            this.parent.numberOfPendingArguments--;
        }

        this.parent.args[this.parentArgIndex] = result;
        return NULL;
    }
}

/**
 * @template S,T
 * @param {(...args: S) => T} func
 * @param {S} args
 * @return {StackFrame}
 */
function call(func, ...args) {
    return new StackFrame(func, args);
}

/**
 * @template S,T
 * @param {any} thisArg
 * @param {(...args: S) => T} func
 * @param {S} args
 * @return {StackFrame}
 */
function callWithContext(thisArg, func, ...args) {
    return new StackFrame(func, args).setContext(thisArg);
}

/**
 * @template T
 * @class CallStack
 */
class CallStack {
    /**
     * @constructor
     * @param {StackFrame<T>} firstFrame
     * @param {Map} memory
     */
    constructor(firstFrame, memory = null) {
        this.frames = [firstFrame];
        this.memory = memory;
    }

    /**
     * @return T
     */
    evaluateStack() {
        let cur;
        let result;
        OUTER:
        while (this.frames.length !== 0) {
            cur = this.frames[this.frames.length - 1];
            if (cur.numberOfPendingArguments > 0) {
                cur.pushUnevaluatedArguments(this.frames);
                continue;
            }
            this.frames.pop();
            result = cur.evaluate();
            while (result === NULL) {
                cur = this.frames[this.frames.length - 1];
                if (cur.numberOfPendingArguments > 0) {
                    cur.pushUnevaluatedArguments(this.frames);
                    continue OUTER;
                }
                this.frames.pop();
                result = cur.evaluate();
            }
            if (result instanceof StackFrame) {
                this.frames.push(result);
                continue;
            }
            return result;
        }
    }
}

/**
 * @template S,T
 * @param {(...args: S) => T} func
 * @param {any=} thisArg
 * @param {{
 *   memoize: boolean,
 * }=} options
 * @return {(...args: S) => T}
 */
function recursive(func, thisArg = null, opts = {}) {
    let memory;
    if (opts.memoize) {
        memory = new Map();
        memory.set(RETURNED, NULL);
    }
    const recursiveFunc = (...args) => {
        let firstEval;
        if (opts.memoize) {
            firstEval = retrieveFromMemory(memory, args);
            if (firstEval !== NULL) {
                return firstEval;
            }
        }
        firstEval = func.apply(thisArg, args);
        if (!(firstEval instanceof StackFrame)) {
            if (opts.memoize) cacheResultInMemory(memory, args, firstEval);
            return firstEval;
        }
        const params = [firstEval];
        if (opts.memoize) params.push(memory);
        return new CallStack(...params).evaluateStack();
    };
    Object.defineProperty(
        recursiveFunc,
        'name',
        { value: func.name || 'recurse' });
    originalFunctionMap.set(recursiveFunc, func);
    return recursiveFunc;
}

module.exports = {
    call,
    callWithContext,
    recursive,
};
