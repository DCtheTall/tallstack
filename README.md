# tallstack

A small library which allows you to define tail recursive functions
in JavaScript that will not cause stack overflow.

It is published for download on [npm](https://www.npmjs.com/package/tallstack).

## Contents

1. [How do I use it?](#how-do-i-use-it)
2. [How does it work?](#how-does-it-work)
3. [What are the drawbacks?](#what-are-the-drawbacks)
4. [License](#license)
5. [Contributing](#contributing)

## How do I use it?

The library only exports 3 functions, `call`, `callWithContext`, and `recursive`.
Let's look at an example function which computes the `N` factorial:

```javascript
const { recursive, call } = require('tallstack');

const multiply = (x, y) => (x * y);

const factorial = recursive((N) => {
    if (N === 0) return 1;
    return call(multiply, N, call(factorial, N - 1));
});
```

Each recursive function you want to define should be wrapped in the currying
function, `recursive`, which returns a new function with the same call signature.

Each call to the recursive function within its body must be done by using `call`,
supplying the function you wish to execute as the first argument and all the parameters
for that function as subsequent arguments.

It is important to note that even if you are calling an auxiliary function which uses
a recursive case as an argument, you still need to use `call` (e.g. `multiply` in the
example above).

You can also use `callWithContext` to set the `this` argument in whichever function you are
calling. Extending the `N` factorial example above:

```javascript
const { recursive, call, callWithContext } = require('tallstack');

const object = { multiply: (x, y) => (x * y) };
function multiply(x, y) {
    return this.multiply(x, y);
}

const factorial = recursive((N) => {
    if (N === 0) return 1;
    return callWithContext(object, multiply, N, call(factorial, N - 1));
});
```

The function `recurse` also takes an optional 2nd parameter and binds that object to
the recursive function's `this` object. Extending the `N` factorial example again:

```javascript
const { recursive, call, callWithContext } = require('tallstack');

const obj = { multiply: (x, y) => (x * y) };

function factorialWithThis(N) {
    if (N === 0) return 1;
    return call(this.multiply, N, call(factorial, N - 1));
}

const factorial = recursive(factorialWithThis, obj);
```

## How does it work?

The library works by implementing the callstack in JavaScript and then evaluating
the recursion iteratively. The iterative evaluation guarantees that the stack is
not bound by the size of the call stack in the interpreter. This allows you to evaluate
recursions that are thousands or possibly millions of calls deep.

## What are the drawbacks?

So far there are two big drawbacks on the library, and I am going to be actively looking
for ways to improve the library (PRs are welcome, see [Contributing](#contributing)).

### 1. You cannot set local variables with call:

For example you could not do this:

```javascript
const factorial = recursive((N) => {
    if (N === 0) return 1;
    const M = call(factorial, N - 1);
    return M * N; // would return NaN
});
```

with the current implementation I do not see a way to do this. Though it is possible to
use the evaluated result later as an argument to a first argument of `call`. For example:

```javascript
const factorial = recursive((N) => {
    if (N === 0) return 1;
    return call((M) => (M * N), call(factorial, N - 1)); // this is ok!
});
```

usually the `let` keyword in functional languages is syntactic sugar for this type
of evaluation strategy.

### 2. Performance:

So far this library does not evaluate functions as quickly as native JavaScript recursion.
To some extent this is to be expected, due to the added complexity on top of normal function
evaluation. Right now the performance seems to degrade as your recursion tree gets wider (i.e. each
call has many recursive calls). I have done some work to speed it up but it is not quite as fast as
it can get to native, but I am sure there is more that can be done and PRs are welcome.

## License

This software is issued under the Apache 2.0 license. It is free for use as is without
warranty for personal or recreational use. You can read more by looking at LICENSE.

## Contributing

I every intention of keeping this software open source and free for use. If someone can use this
code to make a different library that does what my library does better then that would be great.
If people want to help make this library better, that's also great!

PRs are welcome but must be reviewed by me. Any changes to the code must pass existing tests and
any additional functionality should also be tested as well. PRs with new test cases are also
welcome.

For more information on community guidlines and expectations, see CONTRIBUTING.md.
