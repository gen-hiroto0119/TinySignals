export { Fragment, jsxs, jsx, mount, onDispose } from "./jsx-runtime";
export type { Child, Component } from "./jsx-runtime";

import { jsx } from "./jsx-runtime";

export function jsxDEV(
  type: Parameters<typeof jsx>[0],
  props: Parameters<typeof jsx>[1],
  key?: unknown,
  _isStaticChildren?: boolean,
  _source?: unknown,
  _self?: unknown
): ReturnType<typeof jsx> {
  return jsx(type, props, key);
}
