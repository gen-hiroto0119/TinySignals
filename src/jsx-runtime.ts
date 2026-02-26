import { effect, isReactiveGetter } from "./reactivity";
import type { Dispose, ReactiveGetter } from "./reactivity";

export const Fragment = Symbol.for("tinyreactive.fragment");

export type Child =
  | Node
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | ReactiveGetter<unknown>
  | Child[];

export type Component<Props extends Record<string, unknown> = Record<string, unknown>> = (
  props: Props & { children?: Child }
) => Child;

type AnyComponent = (props: any) => Child;

type ElementType = string | AnyComponent | typeof Fragment;

type Props = Record<string, unknown> & {
  children?: Child;
};

type Scope = {
  add: (dispose: Dispose) => void;
};

const PROPERTY_PROPS = new Set(["value", "checked", "selected"]);
const BOOLEAN_ATTRIBUTES = new Set(["disabled", "readonly", "required", "multiple"]);

let activeScope: Scope | null = null;

function withScope<T>(scope: Scope | null, callback: () => T): T {
  const previousScope = activeScope;
  activeScope = scope;

  try {
    return callback();
  } finally {
    activeScope = previousScope;
  }
}

function registerDispose(dispose: Dispose): void {
  activeScope?.add(dispose);
}

function normalizeChildren(value: Child): Node[] {
  if (Array.isArray(value)) {
    const nodes: Node[] = [];

    for (const item of value) {
      nodes.push(...normalizeChildren(item));
    }

    return nodes;
  }

  if (
    value === null ||
    value === undefined ||
    typeof value === "boolean"
  ) {
    return [];
  }

  if (isReactiveGetter(value)) {
    return [createReactiveTextNode(value)];
  }

  if (value instanceof Node) {
    return [value];
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "bigint"
  ) {
    return [document.createTextNode(String(value))];
  }

  throw new TypeError("Unsupported JSX child value.");
}

function createReactiveTextNode(getter: ReactiveGetter<unknown>): Text {
  const node = document.createTextNode("");
  const dispose = effect(() => {
    const nextText = toText(getter());

    if (node.data !== nextText) {
      node.data = nextText;
    }
  });

  registerDispose(dispose);

  return node;
}

function toText(value: unknown): string {
  if (value === null || value === undefined || typeof value === "boolean") {
    return "";
  }

  return String(value);
}

function setProp(element: Element, rawName: string, value: unknown): void {
  const name = rawName === "className" ? "class" : rawName;

  if (PROPERTY_PROPS.has(name)) {
    const target = element as unknown as Record<string, unknown>;

    if (value === null || value === undefined || value === false) {
      if (name === "value") {
        target[name] = "";
      } else {
        target[name] = false;
      }
      return;
    }

    target[name] = value;
    return;
  }

  if (value === null || value === undefined || value === false) {
    element.removeAttribute(name);
    return;
  }

  if (value === true && BOOLEAN_ATTRIBUTES.has(name.toLowerCase())) {
    element.setAttribute(name, "");
    return;
  }

  element.setAttribute(name, String(value));
}

function applyProps(element: Element, props: Props): void {
  for (const [name, value] of Object.entries(props)) {
    if (name === "children") {
      continue;
    }

    if (/^on/i.test(name)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value !== "function") {
        throw new TypeError(`Event prop "${name}" must be a function.`);
      }

      const eventName = name.slice(2).toLowerCase();
      const listener = value as EventListener;

      element.addEventListener(eventName, listener);
      registerDispose(() => {
        element.removeEventListener(eventName, listener);
      });
      continue;
    }

    if (isReactiveGetter(value)) {
      const dispose = effect(() => {
        setProp(element, name, value());
      });
      registerDispose(dispose);
      continue;
    }

    setProp(element, name, value);
  }
}

function createElement(type: ElementType, props: Props = {}): Node {
  if (type === Fragment) {
    const fragment = document.createDocumentFragment();
    const children = normalizeChildren(props.children ?? null);
    fragment.append(...children);
    return fragment;
  }

  if (typeof type === "function") {
    return resolveNode(type(props));
  }

  const element = document.createElement(type);
  applyProps(element, props);

  const children = normalizeChildren(props.children ?? null);
  element.append(...children);

  return element;
}

function resolveNode(value: Child): Node {
  const nodes = normalizeChildren(value);

  if (nodes.length === 0) {
    return document.createDocumentFragment();
  }

  if (nodes.length === 1) {
    return nodes[0];
  }

  const fragment = document.createDocumentFragment();
  fragment.append(...nodes);
  return fragment;
}

export function jsx(type: ElementType, props: Props | null, _key?: unknown): Node {
  return createElement(type, props ?? {});
}

export const jsxs = jsx;

export function mount(view: () => Child, root: ParentNode): Dispose {
  const disposers: Dispose[] = [];
  const scope: Scope = {
    add: (dispose) => {
      disposers.push(dispose);
    }
  };

  const content = withScope(scope, () => resolveNode(view()));
  root.replaceChildren(content);

  return () => {
    while (disposers.length > 0) {
      const dispose = disposers.pop() as Dispose;
      dispose();
    }

    root.replaceChildren();
  };
}

export namespace JSX {
  export type Element = Node;

  export interface ElementChildrenAttribute {
    children: {};
  }

  export interface IntrinsicElements {
    [elementName: string]: Record<string, unknown>;
  }
}
