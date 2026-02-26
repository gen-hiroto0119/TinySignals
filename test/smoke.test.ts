import { describe, expect, it } from "vitest";
import {
  batch,
  computed,
  effect,
  isReactiveGetter,
  memo,
  signal,
  untrack,
  version
} from "../src/index";

describe("tinyreactive core", () => {
  it("exports version", () => {
    expect(version).toBe("0.1.0");
  });

  it("supports signal read/write/update and peek", () => {
    const count = signal(0);

    expect(count()).toBe(0);
    expect(count.peek()).toBe(0);

    count.set(2);
    expect(count()).toBe(2);

    count.set((value) => value + 3);
    expect(count()).toBe(5);
    expect(count.peek()).toBe(5);
  });

  it("tracks signal reads inside effect and stops after dispose", () => {
    const count = signal(0);
    const seen: number[] = [];

    const dispose = effect(() => {
      seen.push(count());
    });

    expect(seen).toEqual([0]);

    count.set(1);
    expect(seen).toEqual([0, 1]);

    dispose();
    count.set(2);

    expect(seen).toEqual([0, 1]);
  });

  it("skips updates with Object.is semantics", () => {
    const value = signal(Number.NaN);
    let runs = 0;

    effect(() => {
      value();
      runs += 1;
    });

    expect(runs).toBe(1);

    value.set(Number.NaN);
    expect(runs).toBe(1);
  });

  it("coalesces notifications in batch", () => {
    const count = signal(0);
    let runs = 0;

    effect(() => {
      count();
      runs += 1;
    });

    expect(runs).toBe(1);

    batch(() => {
      count.set(1);
      count.set(2);
      count.set(3);
    });

    expect(runs).toBe(2);
  });

  it("handles cascading updates during flush", () => {
    const source = signal(0);
    const derived = signal(0);
    const seen: number[] = [];

    effect(() => {
      const value = source();
      if (value > 0) {
        derived.set(value * 10);
      }
    });

    effect(() => {
      seen.push(derived());
    });

    source.set(2);

    expect(derived()).toBe(20);
    expect(seen).toEqual([0, 20]);
  });

  it("supports untrack in effect", () => {
    const count = signal(0);
    let runs = 0;

    effect(() => {
      runs += 1;
      untrack(() => count());
    });

    expect(runs).toBe(1);

    count.set(1);
    expect(runs).toBe(1);
  });

  it("computes memo lazily and updates when dependencies change", () => {
    const count = signal(2);
    let computeRuns = 0;

    const doubled = memo(() => {
      computeRuns += 1;
      return count() * 2;
    });

    expect(computeRuns).toBe(0);
    expect(doubled()).toBe(4);
    expect(computeRuns).toBe(1);
    expect(doubled()).toBe(4);
    expect(computeRuns).toBe(1);

    count.set(3);
    expect(computeRuns).toBe(2);
    expect(doubled()).toBe(6);
  });

  it("notifies memo subscribers only when memo value changes", () => {
    const count = signal(1);
    const parity = memo(() => count() % 2);
    const seen: number[] = [];

    effect(() => {
      seen.push(parity());
    });

    expect(seen).toEqual([1]);

    count.set(3);
    expect(seen).toEqual([1]);

    count.set(4);
    expect(seen).toEqual([1, 0]);
  });

  it("runs effect cleanup before rerun and on dispose", () => {
    const count = signal(0);
    const events: string[] = [];

    const dispose = effect(() => {
      const value = count();
      events.push(`run:${value}`);

      return () => {
        events.push(`clean:${value}`);
      };
    });

    count.set(1);
    dispose();
    count.set(2);

    expect(events).toEqual(["run:0", "clean:0", "run:1", "clean:1"]);
  });

  it("brands signal and memo getters", () => {
    const count = signal(0);
    const doubled = memo(() => count() * 2);
    const plain = () => 123;

    expect(isReactiveGetter(count)).toBe(true);
    expect(isReactiveGetter(doubled)).toBe(true);
    expect(isReactiveGetter(plain)).toBe(false);
  });

  it("supports computed alias", () => {
    const count = signal(2);
    const tripled = computed(() => count() * 3);

    expect(tripled()).toBe(6);
  });
});
