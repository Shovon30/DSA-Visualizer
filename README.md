# DSA Visualizer

An interactive, browser-based visualizer for **27 Data Structures & Algorithms modules** — built for university CS lab courses. Zero dependencies, zero frameworks, zero setup. Just open and learn.

---

## Features

- **27 algorithm modules** spanning arrays, linked lists, stacks, queues, trees, graphs, sorting, searching, and more
- **Step-by-step animation** with configurable playback speed (1×–10×)
- **Operation log** — timestamped trace of every step executed
- **Collapsible sidebar** with section navigation and responsive mobile layout
- **Dark theme** — designed for prolonged lab sessions
- **Pure vanilla HTML/CSS/JS** — no build step, no Node, no dependencies

---

## Modules

### Core Labs

| Module | Operations |
|---|---|
| **1D Array Lab** | Traversal, insertion, deletion, search, reversal |
| **2D Array + Matrix** | Traversal, addition, multiplication, transpose |
| **Stack (Array)** | Push, pop, peek with LIFO animation |
| **Linear Queue** | Enqueue/dequeue with FRONT & REAR pointer visualization |
| **Circular Queue** | Wrap-around queue using `(index+1) % capacity` |
| **Singly Linked List** | Insert, delete, display with pointer arrows |
| **Stack (Linked List)** | Push/pop at head with node memory addresses |

### Algorithms

| Module | Operations |
|---|---|
| **Searching** | Linear Search, Binary Search |
| **Sorting** | Bubble, Selection, Insertion, Merge, Quick Sort |
| **Strings + Palindrome** | Length, copy, concatenation, palindrome check |

### Advanced

| Module | Operations |
|---|---|
| **Advanced DS/Algo** | Priority Queue, Doubly Linked List, Hash Table (chaining), Binary Search Tree, Graph BFS/DFS |

---

## Quick Start

```bash
git clone https://github.com/your-username/dsa-visualizer.git
cd dsa-visualizer
```

Then open `artifacts/dsa-visualizer/index.html` in any modern browser — or serve it with any static file server:

```bash
# Python
python -m http.server 8080 --directory artifacts/dsa-visualizer

# Node
npx serve artifacts/dsa-visualizer
```

---

## Project Structure

```
artifacts/
├── dsa-visualizer/         # Main app (static HTML/CSS/JS)
│   ├── index.html          # App shell + sidebar nav
│   └── public/
│       ├── style.css       # Dark theme + layout
│       └── script.js       # All 27 module implementations (~2000 lines)
│
└── dsa-video/              # Animated promo video (React + Framer Motion)
    └── src/
        ├── components/video/
        │   ├── VideoTemplate.tsx      # Scene orchestrator
        │   └── video_scenes/          # Scene1–Scene7 components
        └── lib/video/hooks.ts         # useVideoPlayer hook
```

---

## Tech Stack

**Visualizer**
- Vanilla HTML5, CSS3, JavaScript (ES6)
- Google Fonts — Inter + JetBrains Mono
- No build step, no dependencies

**Promo Video**
- React 18 + Vite
- Framer Motion (scene transitions + animations)
- Tailwind CSS

---

## Usage

1. Select a module from the left sidebar
2. Enter values in the input fields shown for that module
3. Click an operation button (e.g. **Insert**, **Push**, **Sort**)
4. Watch the step-by-step animation in the visual area
5. Adjust the **Speed** slider in the header to control animation pace
6. Check the **Operation Log** panel at the bottom to review the execution trace

---

## Screenshots

> Add screenshots here of a few modules in action — e.g. Sorting, Linked List, BST

---

## Contributing

Pull requests are welcome. To add a new module:

1. Add a nav button to `index.html` with `data-module="yourModuleName"`
2. Implement the module function in `public/script.js` following the existing pattern
3. Set `moduleTitle` and `moduleDesc`, render controls with `setControls()`, and animate using `show()` + `sleep()`

---

## License

MIT
