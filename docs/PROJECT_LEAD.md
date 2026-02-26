# TinyReactive Project Lead

## Vision

Build a practical tiny reactive UI runtime with:

- zero runtime dependencies
- web-standard APIs only
- predictable behavior in JSX
- small API surface and implementation size

## Product Principles

1. Small but useful
2. Explicit over magic
3. Stable mental model
4. DOM-first runtime (no VDOM)

## Implementation Strategy

- TypeScript-first for v0 delivery speed and API validation
- Measure first, then optimize (no speculative complexity)
- Consider WASM/compiler only after bottlenecks are proven
- Keep public API stable while internals evolve

## Scope (v0)

- `signal`, `memo`, `computed`, `effect`, `batch`, `untrack`
- getter-first API (`count()` / `count.set()`)
- JSX runtime with reactive child/prop binding
- event props via `/^on/i` rule
- mount-level disposal and `onDispose` cleanup hook

## Non-goals (v0)

- server rendering
- component scheduler with priorities
- suspense-like async rendering
- plugin ecosystem

## Milestones

1. M1: Core reactivity + unit tests
2. M2: JSX runtime + DOM binding tests
3. M3: Mount/disposal and example app
4. M4: API docs and first pre-release

## Quality Gates

- Type-safe public API
- deterministic update behavior
- no memory leaks in mounted/unmounted flows
- passing unit tests on Node LTS
