// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { memo, signal } from "../src/index";
import { Fragment, jsx, jsxs, mount } from "../src/jsx-runtime";

describe("jsx runtime", () => {
  it("renders reactive children and snapshot children", () => {
    const count = signal(0);
    const root = document.createElement("div");

    mount(
      () =>
        jsxs("div", {
          children: [
            jsx("span", { children: count }),
            jsx("span", { children: count() })
          ]
        }),
      root
    );

    const spans = root.querySelectorAll("span");
    expect(spans[0]?.textContent).toBe("0");
    expect(spans[1]?.textContent).toBe("0");

    count.set(2);

    expect(spans[0]?.textContent).toBe("2");
    expect(spans[1]?.textContent).toBe("0");
  });

  it("binds reactive props and updates DOM", () => {
    const count = signal(0);
    const disabled = memo(() => count() > 0);
    const root = document.createElement("div");

    mount(() => jsx("button", { disabled, children: "inc" }), root);

    const button = root.querySelector("button");
    expect(button?.hasAttribute("disabled")).toBe(false);

    count.set(1);
    expect(button?.hasAttribute("disabled")).toBe(true);

    count.set(0);
    expect(button?.hasAttribute("disabled")).toBe(false);
  });

  it("writes value through property binding", () => {
    const text = signal("a");
    const root = document.createElement("div");

    mount(() => jsx("input", { value: text }), root);

    const input = root.querySelector("input") as HTMLInputElement | null;
    expect(input?.value).toBe("a");

    text.set("b");
    expect(input?.value).toBe("b");
  });

  it("treats on* props as event listeners and removes them on dispose", () => {
    const count = signal(0);
    const root = document.createElement("div");
    const dispose = mount(
      () =>
        jsx("button", {
          onClick: () => {
            count.set((value) => value + 1);
          },
          children: "+"
        }),
      root
    );

    const button = root.querySelector("button");
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(count()).toBe(1);

    dispose();

    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(count()).toBe(1);
    expect(root.childNodes.length).toBe(0);
  });

  it("supports Fragment output", () => {
    const root = document.createElement("div");

    mount(
      () =>
        jsxs(Fragment, {
          children: [jsx("span", { children: "a" }), jsx("span", { children: "b" })]
        }),
      root
    );

    expect(root.textContent).toBe("ab");
  });

  it("supports function components and null props", () => {
    const root = document.createElement("div");
    const Label = ({ text }: { text: string }) => jsx("span", { children: text });

    mount(() => jsx(Label, { text: "ok" }), root);
    expect(root.textContent).toBe("ok");

    mount(() => jsx("hr", null), root);
    expect(root.querySelector("hr")).not.toBeNull();
  });
});
