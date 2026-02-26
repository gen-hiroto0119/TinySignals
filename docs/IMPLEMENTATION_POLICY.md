# TinyReactive Implementation Policy

## Goal

Deliver a tiny but practical reactive UI runtime quickly, then optimize from proven bottlenecks.

## Language and Architecture Policy

1. v0 is implemented in TypeScript.
2. Runtime is DOM-first and dependency-free.
3. No VDOM in v0; direct DOM binding through reactive effects.
4. Public API stability is prioritized over early micro-optimizations.

## Why TypeScript First

- Fastest path to validate API and developer experience.
- Strong typing for public primitives (`signal`, `memo`, `effect`, `batch`, `untrack`).
- Easier iteration for semantics like reactive getter branding and JSX prop rules.
- Lower implementation and maintenance cost in early stage.

## Deferred for Later Phases

- WASM implementation of hot paths
- compile-time JSX optimization
- advanced scheduler/priorities
- SSR and hydration

These are intentionally postponed until real usage data shows clear need.

## Criteria to Introduce WASM or Compiler

Adopt WASM/compiler only if at least one condition is met:

1. Measured performance bottleneck cannot be solved cleanly in TypeScript.
2. Bundle-size or runtime overhead requires static optimization.
3. A repeated DOM/update pattern is consistently optimizable at compile time.

## Delivery Plan

1. M1: Reactivity core + tests
2. M2: JSX runtime + DOM semantics + tests
3. M3: mount/dispose lifecycle + tests
4. M4: API docs + local dev env + CI + pre-release

## Definition of Done (v0)

- API behavior is deterministic and tested.
- mount/unmount has no retained listeners/effects.
- Type checking, build, and tests pass in CI.
- Documentation explains both current scope and deferred scope.
