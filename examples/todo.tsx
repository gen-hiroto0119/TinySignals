/** @jsxImportSource ../src */

import { computed, effect, signal } from "../src/index";
import { mount, onDispose } from "../src/jsx-runtime";

type Todo = {
  id: number;
  title: string;
  done: boolean;
};

const todos = signal<Todo[]>([]);
const draft = signal("");
const nextId = signal(1);

const remaining = computed(() => todos().filter((todo) => !todo.done).length);
const completed = computed(() => todos().length - remaining());

function addTodo(): void {
  const title = draft().trim();
  if (title.length === 0) {
    return;
  }

  const id = nextId.peek();
  nextId.set(id + 1);

  todos.set((list) => [{ id, title, done: false }, ...list]);
  draft.set("");
}

function toggleTodo(id: number): void {
  todos.set((list) =>
    list.map((todo) => {
      if (todo.id !== id) {
        return todo;
      }

      return { ...todo, done: !todo.done };
    })
  );
}

function removeTodo(id: number): void {
  todos.set((list) => list.filter((todo) => todo.id !== id));
}

function clearCompleted(): void {
  todos.set((list) => list.filter((todo) => !todo.done));
}

function TodoApp() {
  const list = document.createElement("ul");
  list.className = "todo-list";

  const stopListSync = effect(() => {
    const items = todos().map((todo) => {
      const li = document.createElement("li");
      li.className = todo.done ? "done" : "";

      const toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.checked = todo.done;
      toggle.addEventListener("change", () => toggleTodo(todo.id));

      const label = document.createElement("span");
      label.textContent = todo.title;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ghost";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => removeTodo(todo.id));

      li.append(toggle, label, remove);
      return li;
    });

    list.replaceChildren(...items);
  });

  onDispose(stopListSync);

  return (
    <main class="todo-shell">
      <header>
        <h1>TinyReactive Todo</h1>
        <p>Signals + JSX runtime without VDOM.</p>
      </header>

      <form
        class="composer"
        onSubmit={(event: Event) => {
          event.preventDefault();
          addTodo();
        }}
      >
        <input
          value={draft}
          placeholder="Write a task and press Enter"
          onInput={(event: Event) =>
            draft.set((event.currentTarget as HTMLInputElement).value)
          }
        />
        <button
          type="submit"
          disabled={computed(() => draft().trim().length === 0)}
        >
          Add
        </button>
      </form>

      <section class="toolbar">
        <span>{computed(() => `${remaining()} remaining`)}</span>
        <span>{computed(() => `${completed()} completed`)}</span>
        <button
          type="button"
          onClick={clearCompleted}
          disabled={computed(() => completed() === 0)}
        >
          Clear completed
        </button>
      </section>

      {list}

      <p class="empty-note">
        {computed(() =>
          todos().length === 0 ? "No todos yet. Add your first task." : ""
        )}
      </p>
    </main>
  );
}

const root = document.getElementById("app");

if (root === null) {
  throw new Error("Missing #app root element.");
}

const dispose = mount(() => <TodoApp />, root);

(window as Window & { tinyReactiveDispose?: () => void }).tinyReactiveDispose =
  dispose;
