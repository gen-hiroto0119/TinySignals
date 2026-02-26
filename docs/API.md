# TinyReactive API

## Core

### `signal<T>(initialValue: T): Signal<T>`

Creates a reactive getter with write APIs.

```ts
const count = signal(0);
count(); // tracked read
count.peek(); // untracked read
count.set(1);
count.set((v) => v + 1);
```

Notes:

- `getter()` is a tracked read when called during `effect`/`memo` evaluation.
- `getter.peek()` reads without adding dependencies to the current evaluation.
- `set(next)` uses function value as updater when `typeof next === "function"`.
- If `T` is a function type, `set(fn)` is interpreted as updater, not as stored function value.

### `memo<T>(compute: () => T): ReactiveGetter<T>`

Creates a lazy derived getter cached by dependency tracking.

```ts
const doubled = memo(() => count() * 2);
doubled();
```

Notes:

- `memo` is lazy and computes on first read.
- `memo.peek()` avoids adding dependencies to the current caller.
- `memo.peek()` may still evaluate `compute` and build memo's own dependencies when not initialized.
- `memo/computed` only notify downstream when `Object.is(previous, next)` is `false`.

### `computed<T>(compute: () => T): ReactiveGetter<T>`

Alias of `memo` with a name that reads well in JSX props.

```ts
const disabled = computed(() => count() > 10);
```

### `effect(fn: () => void | Dispose): Dispose`

Runs immediately, tracks reads, re-runs on dependency changes.
If the callback returns a function, it is treated as cleanup.

```ts
const stop = effect(() => {
  console.log(count());
  return () => console.log("cleanup");
});
```

Notes:

- Updates propagate synchronously by default.
- Inside `batch`, dependent effects are queued and flushed once when batch completes.

### `batch<T>(fn: () => T): T`

Coalesces synchronous notifications into a single flush.

```ts
batch(() => {
  count.set(1);
  count.set(2);
});
```

### `untrack<T>(fn: () => T): T`

Executes reads without collecting dependencies for the current effect/memo.

```ts
effect(() => {
  untrack(() => console.log(count()));
});
```

Notes:

- Applies only to dependency collection of the current evaluation context.
- `memo/effect` created inside `fn` still establish their own tracking context.

### `isReactiveGetter(value: unknown): boolean`

Returns `true` only for TinyReactive branded getters (`signal`/`memo`/`computed`).

## JSX Runtime

Import path:

- `tinyreactive/jsx-runtime` (library consumer)
- local repo: `./src/jsx-runtime`

### `jsx(type, props)` / `jsxs(type, props)` / `Fragment`

JSX transform entry points.

### `mount(view, root): Dispose`

Mounts view output into a root node and returns cleanup.

- re-mounting on the same root automatically disposes previous tree
- dispose is idempotent
- releases effects/listeners registered within the mount scope

### `onDispose(fn): void`

Registers component-level cleanup tied to the current mount scope.

```tsx
function Timer() {
  const id = window.setInterval(() => {}, 1000);
  onDispose(() => window.clearInterval(id));
  return <div>running</div>;
}
```

Notes:

- Scope is the current component instance created while rendering under `mount`.
- Cleanup functions run in reverse registration order within each scope (LIFO).

## JSX Semantics

- Child:
  - `count()` => snapshot value
  - `count` => reactive binding
- Props:
  - `/^on/i` => event listener
  - reactive getter => effect-driven updates
  - others => one-time assignment
- Property-first props:
  - `value`, `checked`, `selected`

## Runtime Model

- Component functions run once on mount.
- Reactive getter bindings update only bound DOM parts (text node / attribute / property).
- Updates do not re-run component functions.
