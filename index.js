/*

This library is an implementation of a call stack in JS which allows
you to define recursive functions which avoid stack overflow.

It does so by reimplementing a simplified version of the callstack in
javascript that is then evaluated iteratively in applicative order.

--------------------
Author: Dylan Cutler
License: MIT
Copyright: February, 2019

*/

"use strict";

const NULL = Symbol('null');

const originalFunctionMap = new WeakMap();

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

class CallStack {
    constructor(firstFrame) {
        this.frames = [firstFrame];
    }

    evaluate() {
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
 * @param {any} thisArg
 * @param {(...args: S) => T} func
 */
function recursive(func, thisArg) {
    const name = func.name || 'recurse';
    const recursiveFunc = {
        [name]: (...args) => {
            const firstEval = func.apply(thisArg, args);
            if (!(firstEval instanceof StackFrame)) {
                return firstEval;
            }
            return new CallStack(firstEval).evaluate();
        },
    }[name];
    originalFunctionMap.set(recursiveFunc, func);
    return recursiveFunc;
}

module.exports = {
    call,
    callWithContext,
    recursive,
};
