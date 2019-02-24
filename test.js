const { call, callWithContext, recursive } = require('./index');

class LinkedList {
    constructor() {
        this.next = null;
    }

    append() {
        const next = new LinkedList();
        this.next = next;
        return next;
    }
}

test('Finding the end of a linked list', () => {
    const start = new LinkedList();
    const end = start.append().append().append().append();

    const findEnd = recursive((node) =>
        (node.next === null ? node : call(findEnd, node.next)));
    const got = findEnd(start);

    expect(end).toBe(got);
});

test('Finding the end of a very long linked list', () => {
    const start = new LinkedList();
    let end = start;
    for (let i = 0; i < 1e6; i++) end = end.append();

    const findEnd = recursive((node) =>
        (node.next === null ? node : call(findEnd, node.next)));
    const got = findEnd(start);

    expect(end).toBe(got);
});

test('Computing 10 factorial', () => {
    const fact = recursive((n) =>
        (n === 0 ? 1 : call(m => (n * m), call(fact, n - 1))));
    const got = fact(10);
    expect(3628800).toBe(got);
});

test('Computing 10 factorial using callWithContext', () => {
    const o = { mult: (x, y) => (x * y) };
    function mult(x, y) {
        return this.mult(x, y);
    }
    const fact = recursive((n) =>
        (n === 0 ? 1 : callWithContext(o, mult, n, call(fact, n - 1))));
    const got = fact(10);
    expect(3628800).toBe(got);
});

test('Computing the 15th fibonacci term', () => {
    const add = (x, y) => (x + y);
    const fib = recursive((n) =>
        (n < 3 ? n - 1 : call(add, call(fib, n - 1), call(fib, n - 2))));
    const got = fib(15);
    expect(377).toBe(got);
});

test('Recursing with functions that call one another', () => {
    const isEven = recursive((n) =>
        (n === 0 ? true : call(isOdd, n - 1)));
    const isOdd = recursive((n) =>
        (n === 0 ? false : call(isEven, n - 1)));

    let got = isEven(5e5);
    expect(true).toBe(got);

    got = isOdd(5e5 + 1);
    expect(true).toBe(got);
});
