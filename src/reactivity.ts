export type Dispose = () => void;
export type Setter<T> = (value: T | ((previous: T) => T)) => T;
export type EffectCallback = () => void | Dispose;

const REACTIVE_GETTER = Symbol("tinyreactive.reactive-getter");

type ReactiveBrand = {
  readonly [REACTIVE_GETTER]: true;
};

export type ReactiveGetter<T> = (() => T) &
  ReactiveBrand & {
    peek: () => T;
  };

export type Signal<T> = ReactiveGetter<T> & {
  set: Setter<T>;
};

type Source = {
  subscribers: Set<Subscriber>;
};

type Subscriber = {
  sources: Set<Source>;
  queued: boolean;
  disposed: boolean;
  run: () => void;
};

type SignalSource<T> = Source & {
  value: T;
};

type MemoSource<T> = Source & {
  value: T;
  initialized: boolean;
};

const pendingSubscribers = new Set<Subscriber>();

let activeSubscriber: Subscriber | null = null;
let batchDepth = 0;
let isFlushing = false;

function track(source: Source): void {
  if (activeSubscriber === null || activeSubscriber.disposed) {
    return;
  }

  source.subscribers.add(activeSubscriber);
  activeSubscriber.sources.add(source);
}

function cleanupSources(subscriber: Subscriber): void {
  for (const source of subscriber.sources) {
    source.subscribers.delete(subscriber);
  }

  subscriber.sources.clear();
}

function queueSubscriber(subscriber: Subscriber): void {
  if (subscriber.disposed || subscriber.queued) {
    return;
  }

  subscriber.queued = true;
  pendingSubscribers.add(subscriber);

  if (batchDepth === 0 && !isFlushing) {
    flushPendingSubscribers();
  }
}

function flushPendingSubscribers(): void {
  if (isFlushing) {
    return;
  }

  isFlushing = true;

  try {
    while (pendingSubscribers.size > 0) {
      const iterator = pendingSubscribers.values().next();
      const subscriber = iterator.value as Subscriber;

      pendingSubscribers.delete(subscriber);
      subscriber.queued = false;

      if (!subscriber.disposed) {
        subscriber.run();
      }
    }
  } finally {
    isFlushing = false;
  }
}

function notifySubscribers(source: Source): void {
  const subscribers = Array.from(source.subscribers);

  for (const subscriber of subscribers) {
    queueSubscriber(subscriber);
  }
}

function brandGetter<T extends Function>(getter: T): T {
  Object.defineProperty(getter, REACTIVE_GETTER, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false
  });

  return getter;
}

export function isReactiveGetter(value: unknown): value is ReactiveGetter<unknown> {
  if (typeof value !== "function") {
    return false;
  }

  const branded = value as unknown as { [REACTIVE_GETTER]?: unknown };
  return branded[REACTIVE_GETTER] === true;
}

export function signal<T>(initialValue: T): Signal<T> {
  const source: SignalSource<T> = {
    value: initialValue,
    subscribers: new Set()
  };

  const getter = brandGetter(
    (() => {
      track(source);
      return source.value;
    }) as Signal<T>
  );

  getter.peek = () => source.value;
  getter.set = (valueOrUpdater) => {
    const previous = source.value;
    const next =
      typeof valueOrUpdater === "function"
        ? (valueOrUpdater as (value: T) => T)(previous)
        : valueOrUpdater;

    if (Object.is(previous, next)) {
      return source.value;
    }

    source.value = next;
    notifySubscribers(source);

    return source.value;
  };

  return getter;
}

export function memo<T>(compute: () => T): ReactiveGetter<T> {
  const source: MemoSource<T> = {
    value: undefined as T,
    initialized: false,
    subscribers: new Set()
  };

  const subscriber: Subscriber = {
    sources: new Set(),
    queued: false,
    disposed: false,
    run: () => {
      cleanupSources(subscriber);

      const previousSubscriber = activeSubscriber;
      activeSubscriber = subscriber;

      try {
        const nextValue = compute();
        const hasChanged = !source.initialized || !Object.is(source.value, nextValue);

        source.value = nextValue;

        if (source.initialized && hasChanged) {
          notifySubscribers(source);
        }

        source.initialized = true;
      } finally {
        activeSubscriber = previousSubscriber;
      }
    }
  };

  const evaluate = (): T => {
    if (!source.initialized) {
      subscriber.run();
    }

    return source.value;
  };

  const getter = brandGetter(
    (() => {
      track(source);
      return evaluate();
    }) as ReactiveGetter<T>
  );

  getter.peek = () => evaluate();

  return getter;
}

export const computed = memo;

export function effect(callback: EffectCallback): Dispose {
  let cleanup: Dispose | undefined;

  const subscriber: Subscriber = {
    sources: new Set(),
    queued: false,
    disposed: false,
    run: () => {
      if (subscriber.disposed) {
        return;
      }

      if (cleanup !== undefined) {
        cleanup();
        cleanup = undefined;
      }

      cleanupSources(subscriber);

      const previousSubscriber = activeSubscriber;
      activeSubscriber = subscriber;

      try {
        const result = callback();

        if (typeof result === "function") {
          cleanup = result;
        }
      } finally {
        activeSubscriber = previousSubscriber;
      }
    }
  };

  subscriber.run();

  return () => {
    if (subscriber.disposed) {
      return;
    }

    subscriber.disposed = true;

    if (subscriber.queued) {
      pendingSubscribers.delete(subscriber);
      subscriber.queued = false;
    }

    cleanupSources(subscriber);

    if (cleanup !== undefined) {
      cleanup();
      cleanup = undefined;
    }
  };
}

export function batch<T>(callback: () => T): T {
  batchDepth += 1;

  try {
    return callback();
  } finally {
    batchDepth -= 1;

    if (batchDepth === 0) {
      flushPendingSubscribers();
    }
  }
}

export function untrack<T>(callback: () => T): T {
  const previousSubscriber = activeSubscriber;
  activeSubscriber = null;

  try {
    return callback();
  } finally {
    activeSubscriber = previousSubscriber;
  }
}
