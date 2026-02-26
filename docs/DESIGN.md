# TinyReactive Design

## 1. API Model

### signal

```ts
const count = signal(0);
count(); // read (tracked)
count.set(1); // write
count.set((v) => v + 1); // updater
count.peek(); // read (untracked)
```

### memo / computed

```ts
const doubled = memo(() => count() * 2);
doubled(); // read

const enabled = computed(() => count() < 10);
enabled(); // read
```

### effect / batch / untrack

- `effect(fn)`: tracks dependencies and re-runs on change
- `batch(fn)`: coalesces updates
- `untrack(fn)`: reads without dependency tracking
- `computed(fn)`: alias of `memo(fn)` for JSX readability

## 2. JSX Semantics

### Child expression

- `count()` -> snapshot text/value
- `count` (reactive getter) -> reactive binding

### Props

- `/^on/i` -> always treated as event listener
- reactive getter (`signal` / `memo` / `computed`) -> wrapped in `effect` and applied on updates
- other values -> one-time assignment

### Property vs Attribute

- `value`, `checked`, `selected` -> property assignment
- `class`, `id`, most others -> attribute assignment
- `null` / `undefined` / `false` -> remove attribute

## 3. Reactive Getter Identification

To avoid function-prop ambiguity, reactive getters should be branded internally.
Do not infer reactivity from `typeof value === "function"` alone.

## 4. Lifecycle and Disposal

- `mount(view, root)` should return `dispose()`
- remounting to the same root auto-disposes the previous tree
- all effects/listeners created by `mount` must be released by `dispose()`
- nested cleanup should be deterministic
- `onDispose(fn)` allows component-level cleanup registration

## 5. Performance Baseline

- `Object.is` equality short-circuit for writes
- avoid redundant DOM writes when value is unchanged
- no scheduler in v0 (synchronous propagation)
