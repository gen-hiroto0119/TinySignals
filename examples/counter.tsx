/** @jsxImportSource ../src */

import { signal } from "../src/index";
import { mount, onDispose } from "../src/jsx-runtime";

const count = signal(0);

function Counter() {
  const timer = window.setInterval(() => {
    count.set((value) => value + 1);
  }, 1000);

  onDispose(() => {
    window.clearInterval(timer);
  });

  return (
    <section class="counter">
      <h1>TinyReactive Counter</h1>
      <p>{count}</p>
      <button onClick={() => count.set((value) => value + 1)}>+1</button>
      <button onClick={() => count.set((value) => value - 1)}>-1</button>
    </section>
  );
}

const root = document.getElementById("app");

if (root === null) {
  throw new Error("Missing #app root element.");
}

const dispose = mount(() => <Counter />, root);

// Helpful for manual testing in browser console.
(window as Window & { tinyReactiveDispose?: () => void }).tinyReactiveDispose = dispose;
