# 📋 DOM Task Manager

An **Interactive Task Manager** built using pure **HTML, CSS, and Vanilla JavaScript** — no frameworks, no libraries. This project demonstrates core browser concepts including the DOM rendering pipeline, event propagation, event delegation, and the difference between attributes and properties.

---

## 🔗 Live Demo

> Deploy link here (Netlify / Vercel / GitHub Pages)

---

## 📁 Project Structure

```
task-manager/
├── index.html          # HTML
├── index.html          # CSS
├── index.html          # JavaScript
└── README.md           # This file
```

---

## ✨ Features

| Feature             | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| ➕ Add Task         | Create tasks with a title and category                         |
| ✅ Complete Task    | Toggle tasks between pending and completed                     |
| ✏️ Edit Task        | Inline editing with Enter to save, Escape to cancel            |
| 🗑 Delete Task      | Remove individual tasks from the DOM                           |
| 🔍 Search           | Live search filtering as you type                              |
| 📂 Filter           | Filter by category and status                                  |
| 📊 Stats            | Live counters for total, completed, pending, and deleted tasks |
| 🌙 Theme Toggle     | Dark / Light mode using `data-theme` attribute                 |
| 💾 localStorage     | Tasks and theme persist across page refreshes                  |
| 📦 DocumentFragment | Used inside `renderTasks()` for efficient batch DOM insertion  |

---

## 🧠 Core Concepts Explained

### 1. Parsing

When the browser receives an HTML file, it reads the raw byte stream and begins **parsing** — converting bytes into characters, then into a structured format it can understand. The HTML parser is fault-tolerant, meaning it handles malformed markup gracefully without crashing.

```
Bytes → Characters → Tokens → Nodes → DOM Tree
```

---

### 2. Tokenization

During parsing, the character stream is broken into discrete **tokens**. Each token represents a meaningful unit:

| Token Type  | Example                      |
| ----------- | ---------------------------- |
| `StartTag`  | `<div class="task-card">`    |
| `EndTag`    | `</div>`                     |
| `Character` | `Hello World`                |
| `Comment`   | `<!-- this is a comment -->` |
| `DOCTYPE`   | `<!DOCTYPE html>`            |

Each token carries its name and any associated attributes. The tokenizer hands these to the **tree builder**, which constructs the DOM.

---

### 3. DOM Tree

The **Document Object Model (DOM)** is a tree-like structure where every HTML element becomes a **Node** object. Nodes are linked via parent, child, and sibling relationships.

```
Document
└── html
    ├── head
    │   └── title
    └── body
        ├── header.topbar
        ├── main.app-wrapper
        │   ├── section#section-tasks
        │   │   ├── div.stats-row
        │   │   ├── div.form-card
        │   │   └── div#task-container
        │   │       └── div.task-card  ← dynamically created
        │   └── section#section-pipeline
        └── div#toast
```

In this project, every task card is created dynamically using:

```javascript
const card = document.createElement("div"); // create node
const text = document.createTextNode("My Task"); // create text node
card.appendChild(text); // link into tree
container.prepend(card); // insert into DOM
```

---

### 4. CSSOM Tree

While the DOM is being built, the browser also parses CSS into a **CSS Object Model (CSSOM)** — a parallel tree that maps computed styles to each DOM node.

The CSSOM resolves:

- **Cascade** — which rules win when multiple match
- **Specificity** — inline > ID > class > tag
- **Inheritance** — `color` flows down to children

```css
/* This project uses CSS custom properties on :root */
:root {
  --accent: #5c6ef8;
  --bg: #f0f2f8;
}

/* Dark mode overrides via data-theme attribute */
[data-theme="dark"] {
  --bg: #0e1018;
  --accent: #7c8dff;
}
```

The CSSOM is **render-blocking** — the browser will not render anything until all CSS is parsed.

---

### 5. Render Tree

The **Render Tree** is formed by combining the DOM Tree and the CSSOM Tree. It contains only the **visible nodes** — elements with `display: none` are excluded entirely.

```
DOM Tree  +  CSSOM Tree
          ↓
      Render Tree          ← only visible nodes with computed styles
          ↓
        Layout             ← calculates exact position and size (Box Model)
          ↓
        Paint              ← fills pixels: colors, borders, text
          ↓
     Compositing           ← layers assembled and sent to GPU → screen
```

> **Reflow vs Repaint:**  
> Changing `width` or `height` triggers a full **Reflow** (expensive).  
> Changing only `color` or `opacity` triggers just a **Repaint** (cheaper).  
> This is why `DocumentFragment` is used in `renderTasks()` — all cards are built off-screen and inserted in **one** DOM operation, causing only **one** reflow instead of N reflows.

---

### 6. Attributes vs Properties

These look similar but are fundamentally different:

|                              | Attribute                       | Property                              |
| ---------------------------- | ------------------------------- | ------------------------------------- |
| **Definition**               | Defined in HTML markup          | Lives on the DOM object in JavaScript |
| **Source**                   | Original HTML at parse time     | Current live state of the element     |
| **Access**                   | `element.getAttribute("value")` | `element.value`                       |
| **Changes when user types?** | ❌ No — stays as original       | ✅ Yes — updates live                 |

```javascript
// HTML: <input id="demo" value="initial">

const input = document.getElementById("demo");

// User types "hello" into the input field

input.value; // → "hello"         (Property — live)
input.getAttribute("value"); // → "initial"        (Attribute — original)

// They start equal at page load, then diverge once the user interacts
```

**`data-*` attributes** are custom attributes used to store extra information on elements:

```javascript
// Setting
card.setAttribute("data-status", "completed");

// Reading via getAttribute
card.getAttribute("data-status"); // → "completed"

// Reading via dataset (camelCase)
card.dataset.status; // → "completed"

// Checking existence
card.hasAttribute("data-status"); // → true

// Removing
card.removeAttribute("data-status");
```

Every task card in this project carries three data attributes:

```html
<div
  class="task-card"
  data-id="1"
  data-status="pending"
  data-category="work"
></div>
```

---

### 7. Event Bubbling

By default, events **bubble upward** through the DOM — from the element that triggered the event up through its ancestors.

```javascript
// Execution order when child button is clicked:
child.addEventListener("click", () => console.log("Child")); // 1st
parent.addEventListener("click", () => console.log("Parent")); // 2nd
grandparent.addEventListener("click", () => console.log("Grandparent")); // 3rd

// Console output:
// Child
// Parent
// Grandparent
```

To stop bubbling:

```javascript
child.addEventListener("click", (e) => {
  e.stopPropagation(); // event stops here, does not reach parent
});
```

---

### 8. Event Capturing

Capturing is the **opposite of bubbling** — the event travels **top-down** from the root to the target. Enable it by passing `{ capture: true }` as the third argument to `addEventListener`.

```javascript
// Execution order with capture: true
grandparent.addEventListener("click", () => console.log("Grandparent"), {
  capture: true,
}); // 1st
parent.addEventListener("click", () => console.log("Parent"), {
  capture: true,
}); // 2nd
child.addEventListener("click", () => console.log("Child"), { capture: true }); // 3rd

// Console output:
// Grandparent
// Parent
// Child
```

|                  | Bubbling             | Capturing                                    |
| ---------------- | -------------------- | -------------------------------------------- |
| Direction        | Bottom → Up          | Top → Down                                   |
| Default?         | ✅ Yes               | ❌ No (opt-in)                               |
| `capture` option | `false`              | `true`                                       |
| Use case         | Most UI interactions | Intercepting events before they reach target |

---

### 9. Event Delegation

Instead of attaching individual listeners to every task card, **Event Delegation** attaches a **single listener to the parent container** and identifies the target using `e.target`.

```javascript
// ❌ WITHOUT delegation — N × 3 listeners (bad)
tasks.forEach((task) => {
  task.querySelector(".edit").addEventListener("click", handleEdit);
  task.querySelector(".complete").addEventListener("click", handleComplete);
  task.querySelector(".delete").addEventListener("click", handleDelete);
});

// ✅ WITH delegation — 1 listener total (good)
document.getElementById("task-container").addEventListener("click", (e) => {
  const action = e.target.closest("[data-action]")?.dataset.action;
  const card = e.target.closest(".task-card");
  if (!card) return;

  if (action === "delete") handleDelete(card, taskId);
  if (action === "complete") handleComplete(card, taskId);
  if (action === "edit") handleEdit(card, taskId);
});
```

**Why delegation is better:**

|                                    | Without Delegation        | With Delegation |
| ---------------------------------- | ------------------------- | --------------- |
| Listeners                          | N × 3 (grows with tasks)  | Always 1        |
| Memory                             | High                      | Low             |
| Works for dynamically added tasks? | ❌ No                     | ✅ Yes          |
| Performance                        | Decreases with more tasks | Constant        |

> Because the listener is on the **container**, it automatically handles tasks added after the page loads — no need to re-attach listeners on every `addTask()` call.

---

## 🛠 DOM Methods Used

| Method                     | Where Used                                                      |
| -------------------------- | --------------------------------------------------------------- |
| `createElement()`          | Creating task cards, buttons, badges                            |
| `createTextNode()`         | Adding text content to elements                                 |
| `append()`                 | Adding multiple children at once                                |
| `prepend()`                | New tasks inserted at top of list                               |
| `before()`                 | Edit input inserted before title element                        |
| `after()`                  | Referenced in edit flow                                         |
| `replaceWith()`            | Empty state swapped with first card; card replaced on edit save |
| `remove()`                 | Deleting a task card from the DOM                               |
| `createDocumentFragment()` | Batch inserting all task cards in one DOM operation             |

---

## 🚀 How to Run

No build step. No dependencies. Just open the file:

```bash
# Option 1 — open directly
open index.html

# Option 2 — local server (recommended)
Open it on Live Server / Live Preview
```


---

## 📚 Submission Checklist

- [x] Task Creation with `createElement`, `createTextNode`, `append`
- [x] `data-id`, `data-status`, `data-category` on every task card
- [x] `getAttribute`, `setAttribute`, `removeAttribute`, `hasAttribute`, `dataset` all demonstrated
- [x] Attribute vs Property live demo with explanation
- [x] `append`, `prepend`, `before`, `after`, `replaceWith`, `remove` all used
- [x] Dark / Light theme using `classList`, `dataset`, `setAttribute`
- [x] `addEventListener` for all task actions
- [x] Event Delegation — single listener on `#task-container`
- [x] Event Bubbling demo with console output
- [x] Event Capturing demo with `{ capture: true }`
- [x] Browser Rendering Pipeline visual section
- [x] Task Search (Bonus)
- [x] Filter by Category and Status (Bonus)
- [x] Completed and Pending counters (Bonus)
- [x] Clear All Tasks button (Bonus)
- [x] `DocumentFragment` used in `renderTasks()` (Bonus)
- [x] `localStorage` persistence (Bonus)

---

## 👨‍💻 Built With

- HTML5
- CSS3 (Custom Properties, Grid, Flexbox)
- Vanilla JavaScript (ES6+)
- Zero frameworks. Zero libraries.
