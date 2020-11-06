# node algebraic effects

This library is heavily inspired by [this](https://overreacted.io/algebraic-effects-for-the-rest-of-us/) article & [this](https://github.com/macabeus/js-proposal-algebraic-effects) proposal.

This library is only compatible with node `>v12.17.x` as it relies on `AsyncLocalStorage`.

### API

The library exposes 2 functions:

`perform`, which takes 1 or more arguments. It can **only** be called inside of a function wrapped by `handle`

- `effect` - a `string` representing the effect to be handled by the `effectHandler` (see below)
- `...rest` - any additional arguments passed down to the `effectHandler`

and returns the value resolved by the `effectHandler`

`handle`, which takes 2 arguments:

- `task` - a function that will be immediately called. It can call `perform`, which will be handled by the
- `effectHandler` - it can be either an object or a function
  - `object` - an object whose keys are effect names (passed to `perform`) and values are functions, that take any extra arguments passed to `perform`. The return value is passed back to the `task`. If `perform` is called with an unknown key, an error will be thrown.
  - `function` - a function, which is passed 2 or more arguments:
    - `resume` - an async function, which **must** be called **once** in an async flow. The return value will resolve (or reject) once the `task` resolves (or rejects)
    - `effect` - the effect name passed to `perform`
    - `...rest` - additional arguments passed to `perform`

and returns the same value as `task`

### Examples

Basic:

```js
const wait = (n) => Promise((resolve) => setTimeout(resolve, n));

handle(
  async () => {
    const n = await perform("get2");
    const result = await perform("makeHeavyComputations", n, n);
    await perform("log", result);
  },
  {
    log: console.log,
    get2: () => 2,
    makeHeavyComputations: async (a, b) => {
      await wait(1000);
      return a + b;
    },
  }
);

// logs 2 to the console
```

Advanced:

```js
const performWithFile = async fileLocaton => {
  const fileHandle = await perform('get_file', fileLocation)
  const contents = await perform('read_file', fileHandle)
  const result = await perform('compute', contents)
  return result
}

// file in the local fs

const result = await handle(
  () => performWithFile('file_path'),
  async (resume, effect, ...args) => {
    switch(effect) {
      case 'get_file':
        const handle = await createFileReadStream(args[0])
        try {
          await resume(handle)
        } finally {
          // remember to close the unused file
          await closeFile(handle)
        }
        break
      case 'read_file':
        const fileContents = await readFileContents(args[0])
        resume(fileContents)
        break
      case 'compute':
        const result = await computeResults(args[0])
        resume(result)
        break
    }
})

// file on the web, no need to close after:
const result = await handle(() => performWithFile('url'), {
  get_file: fetch,
  read_file: response => response.json()
  compute: computeResults
})

```

The compute from the above example is the same, so we can partially handle the computation:

```js
const performComputationWithFile = fileLocation => () =>
  handle(() => performWithFile(fileLocatiion), {
    compute: computeResults,
  }));

// file in the local fs

const result = await handle(
  () => performComputationWithFile("file_path"),
  async (resume, effect, ...args) => {
    switch (effect) {
      case "get_file":
        const handle = await createFileReadStream(args[0]);
        try {
          await resume(handle);
        } finally {
          // remember to close the unused file
          await closeFile(handle);
        }
        break;
      case "read_file":
        const fileContents = await readFileContents(args[0]);
        resume(fileContents);
        break;
    }
  }
);

// file on the web, no need to close after:
const result = await handle(() => performComputationWithFile("url"), {
  get_file: fetch,
  read_file: (response) => response.json(),
});
```
