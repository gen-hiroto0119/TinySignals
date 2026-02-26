export const version = "0.1.0";

export {
  batch,
  computed,
  effect,
  isReactiveGetter,
  memo,
  signal,
  untrack
} from "./reactivity";

export type {
  Dispose,
  EffectCallback,
  ReactiveGetter,
  Setter,
  Signal
} from "./reactivity";
