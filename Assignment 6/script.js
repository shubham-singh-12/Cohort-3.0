"use strict";

/* ═══════════════════════════════════
   STATE
═══════════════════════════════════ */
let taskIdCounter = 0;
let deletedCount = 0;

// Load from localStorage if available
const saved = localStorage.getItem("dm_tasks");
const savedDeleted = localStorage.getItem("dm_deleted");
let taskStore = saved ? JSON.parse(saved) : [];
deletedCount = savedDeleted ? parseInt(savedDeleted) : 0;

/* ═══════════════════════════════════
   SECTION NAVIGATION
═══════════════════════════════════ */
const navTabs = document.querySelectorAll(".nav-tab");
const sections = document.querySelectorAll(".section");
const mobileNav = document.getElementById("mobileNav");

function showSection(id) {
    sections.forEach(s => s.classList.remove("active"));
    navTabs.forEach(t => t.classList.remove("active"));

    const target = document.getElementById("section-" + id);
    if (target) target.classList.add("active");

    navTabs.forEach(t => { if (t.dataset.section === id) t.classList.add("active"); });
    mobileNav.value = id;
}

// Single delegated listener for nav tabs
document.getElementById("navTabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".nav-tab");
    if (tab) showSection(tab.dataset.section);
});

mobileNav.addEventListener("change", (e) => showSection(e.target.value));

/* ═══════════════════════════════════
   THEME TOGGLE
   Uses: classList, dataset, setAttribute
═══════════════════════════════════ */
const htmlEl = document.documentElement;
const themeBtn = document.getElementById("themeBtn");
const themeLabel = document.getElementById("themeLabel");

// Restore saved theme
const savedTheme = localStorage.getItem("dm_theme") || "light";
applyTheme(savedTheme);

function applyTheme(theme) {
    // setAttribute used here — sets data-theme on <html>
    htmlEl.setAttribute("data-theme", theme);
    themeLabel.textContent = theme === "dark" ? "Dark" : "Light";
    // Store in dataset
    htmlEl.dataset.theme = theme;
    localStorage.setItem("dm_theme", theme);
}

themeBtn.addEventListener("click", () => {
    // Read current theme via getAttribute (Attribute API)
    const current = htmlEl.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
});

/* ═══════════════════════════════════
   TOAST
═══════════════════════════════════ */
const toastEl = document.getElementById("toast");
let toastTimer;
function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

/* ═══════════════════════════════════
   STATS
═══════════════════════════════════ */
function updateStats() {
    const total = taskStore.length;
    const completed = taskStore.filter(t => t.status === "completed").length;
    const pending = total - completed;

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statCompleted").textContent = completed;
    document.getElementById("statPending").textContent = pending;
    document.getElementById("statDeleted").textContent = deletedCount;
}

/* ═══════════════════════════════════
   PERSIST
═══════════════════════════════════ */
function persist() {
    localStorage.setItem("dm_tasks", JSON.stringify(taskStore));
    localStorage.setItem("dm_deleted", String(deletedCount));
}

/* ═══════════════════════════════════
   CREATE TASK CARD DOM ELEMENT
   Uses: createElement, createTextNode,
         setAttribute, dataset, append
═══════════════════════════════════ */
function createTaskCard(task) {
    // createElement()
    const card = document.createElement("div");
    card.className = "task-card";

    // setAttribute() — sets data-* attributes
    card.setAttribute("data-id", task.id);
    card.setAttribute("data-status", task.status);
    card.setAttribute("data-category", task.category);
    // Also accessible via dataset
    // card.dataset.id = task.id; — equivalent

    const emojiMap = { work: "💼", personal: "🏠", study: "📚", health: "💪", other: "✨" };

    // Build inner HTML using createElement + createTextNode
    const checkBtn = document.createElement("button");
    checkBtn.className = "task-check";
    checkBtn.setAttribute("data-action", "complete");
    checkBtn.setAttribute("title", "Mark complete");
    checkBtn.setAttribute("aria-label", "Toggle complete");
    // createTextNode()
    checkBtn.appendChild(document.createTextNode(task.status === "completed" ? "✓" : ""));

    const body = document.createElement("div");
    body.className = "task-body";

    const titleEl = document.createElement("div");
    titleEl.className = "task-title";
    titleEl.appendChild(document.createTextNode(task.title));

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const badge = document.createElement("span");
    badge.className = `task-badge badge-${task.category}`;
    badge.appendChild(document.createTextNode(emojiMap[task.category] + " " + task.category));

    const idSpan = document.createElement("span");
    idSpan.className = "task-id";
    idSpan.appendChild(document.createTextNode("#" + task.id));

    // append() — preferred over appendChild for multiple nodes
    meta.append(badge, idSpan);
    body.append(titleEl, meta);

    // Action buttons — data-action for delegation
    const actions = document.createElement("div");
    actions.className = "task-actions";

    const btns = [
        { action: "edit", icon: "✏️", title: "Edit task", cls: "edit" },
        { action: "complete", icon: "✅", title: "Toggle done", cls: "complete" },
        { action: "delete", icon: "🗑", title: "Delete task", cls: "delete" },
    ];

    btns.forEach(b => {
        const btn = document.createElement("button");
        btn.className = `task-btn ${b.cls}`;
        btn.setAttribute("data-action", b.action);
        btn.setAttribute("title", b.title);
        btn.setAttribute("aria-label", b.title);
        btn.appendChild(document.createTextNode(b.icon));
        actions.appendChild(btn);
    });

    // append() to card
    card.append(checkBtn, body, actions);
    return card;
}

/* ═══════════════════════════════════
   RENDER TASK LIST
═══════════════════════════════════ */
function renderTasks(list = taskStore) {
    const container = document.getElementById("task-container");

    // Use DocumentFragment for efficient bulk insert
    const frag = document.createDocumentFragment();

    if (list.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.innerHTML = `<div class="empty-icon">📭</div><p>No tasks found.</p>`;
        frag.appendChild(empty);
    } else {
        list.forEach(task => frag.appendChild(createTaskCard(task)));
    }

    container.innerHTML = "";
    container.appendChild(frag);
    updateStats();
}

/* ═══════════════════════════════════
   ADD TASK
═══════════════════════════════════ */
const taskInput = document.getElementById("taskInput");
const categorySelect = document.getElementById("categorySelect");

function addTask() {
    // input.value = Property (current live value)
    const title = taskInput.value.trim();

    // input.getAttribute("value") = Attribute (original HTML value, stays "")
    // console.log("Attribute:", taskInput.getAttribute("value")); // → ""
    // console.log("Property: ", taskInput.value);                 // → whatever user typed

    if (!title) {
        showToast("⚠️ Please enter a task title!");
        taskInput.focus();
        return;
    }

    taskIdCounter++;
    const task = {
        id: taskIdCounter,
        title: title,
        category: categorySelect.value,
        status: "pending",
    };

    taskStore.push(task);
    persist();

    const card = createTaskCard(task);

    const container = document.getElementById("task-container");
    const empty = container.querySelector(".empty-state");

    if (empty) {
        // replaceWith() — swaps empty state with first card
        empty.replaceWith(card);
    } else {
        // prepend() — adds newest task to TOP
        container.prepend(card);
    }

    updateStats();
    taskInput.value = "";
    taskInput.focus();
    showToast("✅ Task added!");
}

document.getElementById("addTaskBtn").addEventListener("click", addTask);
taskInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });

/* ═══════════════════════════════════
   EVENT DELEGATION — single listener
   on parent #task-container handles
   ALL task interactions
═══════════════════════════════════ */
document.getElementById("task-container").addEventListener("click", (e) => {
    // Walk up the DOM to find the action button
    const actionEl = e.target.closest("[data-action]");
    const card = e.target.closest(".task-card");
    if (!card || !actionEl) return;

    const action = actionEl.dataset.action;
    const taskId = parseInt(card.getAttribute("data-id"));

    if (action === "delete") handleDelete(card, taskId);
    if (action === "complete") handleComplete(card, taskId);
    if (action === "edit") handleEdit(card, taskId);
});

/* ═══════════════════════════════════
   DELETE
   Uses: remove()
═══════════════════════════════════ */
function handleDelete(card, taskId) {
    // remove() — removes element from the DOM
    card.remove();

    taskStore = taskStore.filter(t => t.id !== taskId);
    deletedCount++;
    persist();
    updateStats();

    const container = document.getElementById("task-container");
    if (container.children.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.innerHTML = `<div class="empty-icon">📭</div><p>No tasks found.</p>`;
        container.appendChild(empty);
    }
    showToast("🗑 Task deleted");
}

/* ═══════════════════════════════════
   COMPLETE
   Uses: setAttribute, getAttribute,
         dataset, classList
═══════════════════════════════════ */
function handleComplete(card, taskId) {
    // getAttribute() — read current status
    const current = card.getAttribute("data-status");
    const next = current === "completed" ? "pending" : "completed";

    // setAttribute() — update attribute
    card.setAttribute("data-status", next);

    // Update check button text
    const checkBtn = card.querySelector(".task-check");
    checkBtn.textContent = next === "completed" ? "✓" : "";

    // Update title style
    const titleEl = card.querySelector(".task-title");
    if (next === "completed") {
        titleEl.style.textDecoration = "line-through";
    } else {
        titleEl.style.textDecoration = "";
    }

    // Sync taskStore
    const task = taskStore.find(t => t.id === taskId);
    if (task) { task.status = next; persist(); }

    updateStats();
    showToast(next === "completed" ? "✅ Task completed!" : "↩️ Marked pending");
}

/* ═══════════════════════════════════
   EDIT — inline editing
   Uses: replaceWith(), before(), after()
═══════════════════════════════════ */
function handleEdit(card, taskId) {
    const task = taskStore.find(t => t.id === taskId);
    if (!task) return;

    const titleEl = card.querySelector(".task-title");
    const current = titleEl.textContent;

    // Check if already editing
    if (card.querySelector(".task-edit-input")) return;

    // Create edit input
    const input = document.createElement("input");
    input.type = "text";
    input.className = "task-edit-input";
    input.value = current;

    // before() — insert input before the title
    titleEl.before(input);
    titleEl.style.display = "none";
    input.focus();
    input.select();

    function saveEdit() {
        const newTitle = input.value.trim();
        if (!newTitle) { cancelEdit(); return; }

        task.title = newTitle;
        persist();

        // Create updated card using replaceWith()
        const updated = createTaskCard(task);
        // replaceWith() — swap old card with new one
        card.replaceWith(updated);
        updateStats();
        showToast("✏️ Task updated");
    }

    function cancelEdit() {
        // after() — could insert a message after card
        input.remove();
        titleEl.style.display = "";
    }

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveEdit();
        if (e.key === "Escape") cancelEdit();
    });
    input.addEventListener("blur", saveEdit);
}

/* ═══════════════════════════════════
   SEARCH + FILTER
═══════════════════════════════════ */
function applyFilters() {
    const q = document.getElementById("searchInput").value.toLowerCase();
    const cat = document.getElementById("filterSelect").value;
    const status = document.getElementById("statusFilter").value;

    const filtered = taskStore.filter(task => {
        const matchQ = task.title.toLowerCase().includes(q);
        const matchCat = cat === "all" || task.category === cat;
        const matchSt = status === "all" || task.status === status;
        return matchQ && matchCat && matchSt;
    });

    renderTasks(filtered);
}

document.getElementById("searchInput").addEventListener("input", applyFilters);
document.getElementById("filterSelect").addEventListener("change", applyFilters);
document.getElementById("statusFilter").addEventListener("change", applyFilters);

/* ═══════════════════════════════════
   CLEAR ALL
═══════════════════════════════════ */
document.getElementById("clearAllBtn").addEventListener("click", () => {
    if (!taskStore.length) { showToast("Nothing to clear!"); return; }
    if (!confirm("Delete all tasks?")) return;
    deletedCount += taskStore.length;
    taskStore = [];
    persist();
    renderTasks();
    showToast("🗑 All tasks cleared");
});

/* ═══════════════════════════════════
   DOCUMENT FRAGMENT DEMO
═══════════════════════════════════ */
// document.getElementById("fragBtn").addEventListener("click", () => {
//     const list = document.getElementById("fragList");
//     const frag = document.createDocumentFragment(); // off-screen container

//     const items = ["🍵 Chai", "🌿 Matcha", "🫖 Earl Grey", "☕ Oolong", "🍃 Rooibos"];
//     items.forEach(name => {
//         const span = document.createElement("span");
//         span.className = "frag-item";
//         span.textContent = name;
//         frag.appendChild(span); // adds to fragment (no DOM reflow yet!)
//     });

//     list.innerHTML = "";
//     list.appendChild(frag); // ONE reflow — all items inserted together
//     showToast("📦 Fragment inserted — 1 reflow!");
// });

document.getElementById("fragBtn").addEventListener("click", () => {
    const list = document.getElementById("fragList");
    const frag = document.createDocumentFragment();

    const items = ["🍵 Chai", "🌿 Matcha", "🫖 Earl Grey", "☕ Oolong", "🍃 Rooibos"];
    items.forEach(name => {
        const span = document.createElement("span");
        span.className = "frag-item";
        span.textContent = name;
        span.style.cursor = "pointer";

        // Make each item toggleable on click
        span.addEventListener("click", () => {
            const isSelected = span.getAttribute("data-selected") === "true";

            if (isSelected) {
                span.setAttribute("data-selected", "false");
                span.style.background = "var(--accent-light)";
                span.style.color = "var(--accent)";
                span.style.outline = "";
            } else {
                span.setAttribute("data-selected", "true");
                span.style.background = "var(--accent)";
                span.style.color = "#fff";
                span.style.outline = "2px solid var(--accent)";
            }
        });

        frag.appendChild(span);
    });

    list.innerHTML = "";
    list.appendChild(frag);
    showToast("📦 Fragment inserted — click items to select!");
});

/* ═══════════════════════════════════
   ATTR vs PROP DEMO
═══════════════════════════════════ */
document.getElementById("checkAttrBtn").addEventListener("click", () => {
    const input = document.getElementById("attrDemoInput");

    // Property — reflects CURRENT value (what user typed)
    document.getElementById("propResult").textContent = `"${input.value}"`;

    // Attribute — reflects ORIGINAL HTML value
    document.getElementById("attrResult").textContent = `"${input.getAttribute("value")}"`;
});

/* ═══════════════════════════════════
   DATASET DEMO
═══════════════════════════════════ */
document.getElementById("datasetDemoBtn").addEventListener("click", () => {
    const out = document.getElementById("datasetOutput");

    // Create a demo element
    const demo = document.createElement("div");
    demo.setAttribute("data-id", "task-99");
    demo.setAttribute("data-status", "pending");
    demo.setAttribute("data-category", "work");

    const lines = [
        `<b>1.</b> Created element with data attributes`,
        `<b>2.</b> getAttribute("data-status") = <code style="color:var(--green);font-family:var(--mono)">"${demo.getAttribute("data-status")}"</code>`,
        `<b>3.</b> dataset.status = <code style="color:var(--green);font-family:var(--mono)">"${demo.dataset.status}"</code>`,
        `<b>4.</b> hasAttribute("data-status") = <code style="color:var(--cyan);font-family:var(--mono)">${demo.hasAttribute("data-status")}</code>`,
        `<b>5.</b> setAttribute("data-status", "completed") → done`,
        `<b>6.</b> getAttribute("data-status") = <code style="color:var(--amber);font-family:var(--mono)">"${(demo.setAttribute("data-status", "completed"), demo.getAttribute("data-status"))}"</code>`,
        `<b>7.</b> removeAttribute("data-status") → done`,
        `<b>8.</b> hasAttribute("data-status") = <code style="color:var(--red);font-family:var(--mono)">${(demo.removeAttribute("data-status"), demo.hasAttribute("data-status"))}</code>`,
    ];

    out.innerHTML = lines.join("<br>");
    showToast("✓ Dataset demo ran!");
});

/* ═══════════════════════════════════
   EVENT BUBBLING DEMO
   Default: capture = false (bubbling)
═══════════════════════════════════ */
const bubbleConsole = document.getElementById("bubbleConsole");

function logBubble(msg, cls) {
    const line = document.createElement("div");
    line.className = `console-line ${cls}`;
    line.innerHTML = `<span class="console-prompt">&gt;&gt;</span> ${msg}`;
    bubbleConsole.appendChild(line);
    bubbleConsole.scrollTop = bubbleConsole.scrollHeight;
}

// Bubbling: event goes Child → Parent → Grandparent
// capture = false (default)
document.getElementById("bubble-grandparent").addEventListener("click", () => {
    logBubble("Grandparent 🟡 (bubbled up last)", "grandparent");
}, false); // capture: false = bubbling phase

document.getElementById("bubble-parent").addEventListener("click", () => {
    logBubble("Parent 🔵 (bubbled up middle)", "parent");
}, false);

document.getElementById("bubble-child").addEventListener("click", () => {
    const sep = document.createElement("div");
    sep.className = "console-line separator";
    sep.textContent = "─── Click event fired ───";
    bubbleConsole.appendChild(sep);
    logBubble("Child 🟢 (fires first — origin)", "child");
}, false);

document.getElementById("clearBubble").addEventListener("click", () => {
    bubbleConsole.innerHTML = `<div style="color:#4a5280;font-size:.75rem">// Click the button to see bubbling order…</div>`;
});

/* ═══════════════════════════════════
   EVENT CAPTURING DEMO
   capture = true → top-down
═══════════════════════════════════ */
const captureConsole = document.getElementById("captureConsole");

function logCapture(msg, cls) {
    const line = document.createElement("div");
    line.className = `console-line ${cls}`;
    line.innerHTML = `<span class="console-prompt">&gt;&gt;</span> ${msg}`;
    captureConsole.appendChild(line);
    captureConsole.scrollTop = captureConsole.scrollHeight;
}

// Capturing: event goes Grandparent → Parent → Child
// capture = true
document.getElementById("capture-grandparent").addEventListener("click", () => {
    const sep = document.createElement("div");
    sep.className = "console-line separator";
    sep.textContent = "─── Click event fired ───";
    captureConsole.appendChild(sep);
    logCapture("Grandparent 🟡 (captured first — top)", "grandparent");
}, true); // capture: true = capturing phase

document.getElementById("capture-parent").addEventListener("click", () => {
    logCapture("Parent 🔵 (captured middle)", "parent");
}, true);

document.getElementById("capture-child").addEventListener("click", () => {
    logCapture("Child 🟢 (captured last — target)", "child");
}, true);

document.getElementById("clearCapture").addEventListener("click", () => {
    captureConsole.innerHTML = `<div style="color:#4a5280;font-size:.75rem">// Click the button to see capturing order…</div>`;
});

/* ═══════════════════════════════════
   INITIAL RENDER
═══════════════════════════════════ */
if (taskStore.length > 0) {
    // Restore ID counter from saved tasks
    taskIdCounter = Math.max(...taskStore.map(t => t.id));
    renderTasks();
} else {
    updateStats();
}