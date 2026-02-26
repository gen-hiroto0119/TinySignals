# Runtime Review Checklist

Use this checklist to review lifecycle safety in `jsx-runtime`.

## 1. Scope Lifecycle

- [ ] Every effect/listener registered during mount is attached to a scope (`activeScope.add`).
- [ ] Child component scopes are attached to parent scope (`createScope(parentScope)`).
- [ ] Scope disposal is idempotent.
- [ ] Scope disposal runs cleanup in LIFO order.

Reference:
- `createScope` in `src/jsx-runtime.ts`
- `onDispose` in `src/jsx-runtime.ts`

## 2. Reactive Child Binding (Text Nodes)

- [ ] Reactive child (`{count}`) creates exactly one `effect`.
- [ ] Effect updates only the bound text node, not full subtree/component rerender.
- [ ] Disposing mount stops further text updates.
- [ ] No retained updates after remount to same root.

Reference:
- `createReactiveTextNode` in `src/jsx-runtime.ts`

## 3. Reactive Prop Binding

- [ ] Reactive prop creates exactly one `effect` per prop binding.
- [ ] Prop effect cleanup is bound to mount scope.
- [ ] Non-reactive props are one-shot assignment only.
- [ ] Boolean/null/undefined transitions correctly remove or reset prop/attribute.

Reference:
- `applyProps` and `setProp` in `src/jsx-runtime.ts`

## 4. Event Listener Lifecycle

- [ ] `on*` props always register as event listeners (never reactive getter invocation).
- [ ] Listener removal cleanup is always registered.
- [ ] After `dispose()`, old DOM node events do not mutate signals.
- [ ] Remount on same root removes old listeners via old scope disposal.

Reference:
- event branch in `applyProps` in `src/jsx-runtime.ts`

## 5. Remount / Replacement Safety

- [ ] `mount(view, root)` auto-disposes previous mount on same root.
- [ ] Calling stale dispose from older mount does not clear current mount tree.
- [ ] Calling dispose twice is safe and side-effect free.
- [ ] Root cleanup happens only for active mount instance.

Reference:
- `mountedRoots` and `mount` in `src/jsx-runtime.ts`

## 6. Tracking Boundaries

- [ ] `getter()` collects dependencies in current effect/memo.
- [ ] `getter.peek()` does not collect dependencies in current caller.
- [ ] `untrack(fn)` disables dependency collection only for current context.
- [ ] Nested `effect/memo` created inside `untrack(fn)` still track normally.

Reference:
- `src/reactivity.ts`
- `docs/API.md`

## 7. Regression Tests to Keep

- [ ] Dispose stops reactive child updates.
- [ ] Dispose stops reactive prop updates.
- [ ] Dispose removes event listener effects.
- [ ] Remounting same root detaches old subscriptions/listeners.
- [ ] `onDispose` runs once per component instance and once on unmount.

Current test coverage:
- `test/jsx-runtime.test.ts`
- `test/smoke.test.ts`
