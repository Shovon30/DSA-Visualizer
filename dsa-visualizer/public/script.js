/* ===================================================
   DSA Visualizer — Full Implementation
   Modules: 27 data structures & algorithms
   =================================================== */

const app = {
  delay: 420,
  running: false,
  module: "arrayLab",
  state: {},
  nodeId: 1
};

/* ===== HELPERS ===== */
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }
function html(el, val) { if (el) el.innerHTML = val; }
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms !== undefined ? ms : app.delay); }); }

function setStatus(msg, type) {
  var el = $("#status");
  if (!el) return;
  el.textContent = msg;
  el.className = "status-bar " + (type || "info");
}

var logEntries = [];
function addLog(msg) {
  var now = new Date();
  var ts = now.getHours().toString().padStart(2,"0") + ":" +
            now.getMinutes().toString().padStart(2,"0") + ":" +
            now.getSeconds().toString().padStart(2,"0");
  logEntries.push({ ts: ts, msg: msg });
  if (logEntries.length > 40) logEntries.shift();
  var el = $("#log");
  if (!el) return;
  el.innerHTML = logEntries.map(function(e) {
    return '<div class="log-entry"><span class="log-ts">[' + e.ts + ']</span><span class="log-msg">' + e.msg + '</span></div>';
  }).join("");
  el.scrollTop = el.scrollHeight;
}

function clearLog() { logEntries = []; html($("#log"), ""); }
function setControls(markup) { html($("#controls"), markup); }
function show(markup) { html($("#visual"), markup); }

function parseNums(text) {
  if (!text || !text.trim()) return [];
  return text.trim().split(/[\s,]+/).filter(function(s) { return s !== ""; }).map(Number);
}

function parseMatrix(text) {
  if (!text || !text.trim()) return [];
  return text.trim().split(/[;\n]+/).filter(function(r) { return r.trim(); }).map(function(row) {
    return row.trim().split(/[\s,]+/).filter(function(s) { return s !== ""; }).map(Number);
  });
}

function run(fn) {
  if (app.running) { setStatus("Animation in progress — please wait.", "warn"); return; }
  app.running = true;
  $$("button:not(.nav)").forEach(function(b) { b.disabled = true; });
  fn().catch(function(e) {
    setStatus("Error: " + e.message, "error");
    addLog("Error: " + e.message);
  }).finally(function() {
    app.running = false;
    $$("button:not(.nav)").forEach(function(b) { b.disabled = false; });
  });
}

function fakeAddr(n) { return "0x" + (0x1000 + n * 16).toString(16).toUpperCase(); }

/* ===== RENDER HELPERS ===== */
function renderArray(arr, highlights, pointers) {
  highlights = highlights || {};
  pointers = pointers || {};
  var indicesHtml = arr.map(function(_, i) {
    return '<div class="arr-index">' + i + '</div>';
  }).join("");
  var cellsHtml = arr.map(function(v, i) {
    var cls = "arr-cell";
    if (highlights[i]) cls += " " + highlights[i];
    var ptrs = pointers[i] ? pointers[i] : [];
    var ptrHtml = ptrs.map(function(p) {
      return '<span class="arr-pointer badge badge-accent">' + p + '</span>';
    }).join("");
    return '<div class="' + cls + '">' + v + ptrHtml + '</div>';
  }).join("");
  return '<div class="arr-wrap"><div class="arr-indices">' + indicesHtml + '</div><div class="arr-cells">' + cellsHtml + '</div></div>';
}

function renderStack(stackArr, cap, highlights) {
  highlights = highlights || {};
  var cells = "";
  for (var i = stackArr.length - 1; i >= 0; i--) {
    var cls = "stack-cell";
    if (i === stackArr.length - 1) cls += " top-cell";
    if (highlights[i]) cls += " " + highlights[i];
    cells += '<div class="' + cls + '"><span>' + stackArr[i] + '</span></div>';
  }
  var empties = cap - stackArr.length;
  for (var j = 0; j < empties; j++) {
    cells += '<div class="stack-cell empty-cell" style="opacity:0.25;border-style:dashed;"> </div>';
  }
  cells += '<div class="stack-base">⬇ BOTTOM (cap=' + cap + ')</div>';
  return '<div class="stack-wrap">' + cells + '</div>';
}

function renderQueue(qArr, front, rear, cap, highlights) {
  highlights = highlights || {};
  var cells = "";
  for (var i = 0; i < cap; i++) {
    var cls = "queue-cell";
    var val = " ";
    var ptrHtml = "";
    var isFront = (i === front);
    var isRear  = (i === rear);
    var filled  = false;
    if (front <= rear) {
      filled = i >= front && i <= rear;
    } else if (front > rear) {
      filled = i >= front || i <= rear;
    }
    if (filled) { val = qArr[i] !== undefined ? qArr[i] : "?"; }
    if (!filled) cls += " empty-cell";
    if (isFront && isRear && filled) { cls += " both-cell"; ptrHtml = '<span class="queue-ptr front">F/R</span>'; }
    else {
      if (isFront && filled) { cls += " front-cell"; ptrHtml += '<span class="queue-ptr front">F</span>'; }
      if (isRear  && filled) { cls += " rear-cell";  ptrHtml += '<span class="queue-ptr rear">R</span>'; }
    }
    if (highlights[i]) cls += " " + highlights[i];
    cells += '<div class="' + cls + '" style="position:relative;">' + val + ptrHtml + '</div>';
  }
  return '<div class="queue-wrap"><div class="queue-cells">' + cells + '</div></div>';
}

function renderSLL(nodes, highlights, headLabel) {
  highlights = highlights || {};
  headLabel = headLabel || "HEAD";
  var html2 = '<div class="ll-wrap"><div class="ll-row">';
  html2 += '<span class="ll-head-label">' + headLabel + ' →</span>';
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var cls = "ll-node";
    if (highlights[i] === "active") cls += " active";
    if (highlights[i] === "found") cls += " found";
    if (highlights[i] === "deleted") cls += " deleted";
    var nextVal = i < nodes.length - 1 ? fakeAddr(nodes[i + 1].id) : "NULL";
    html2 += '<div class="' + cls + '">' +
      '<div class="data-part"><span class="ll-val">' + n.val + '</span><span class="ll-addr">' + fakeAddr(n.id) + '</span></div>' +
      '<div class="next-part">→ ' + nextVal + '</div>' +
      '</div>';
    if (i < nodes.length - 1) html2 += '<div class="ll-arrow">→</div>';
  }
  html2 += '<div class="ll-null">→ NULL</div>';
  html2 += '</div></div>';
  return html2;
}

function renderDLL(nodes, highlights) {
  highlights = highlights || {};
  var html2 = '<div class="ll-wrap"><div class="ll-row">';
  html2 += '<span class="ll-head-label">HEAD →</span>';
  html2 += '<div class="ll-null">← NULL</div>';
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var cls = "ll-node dll-node";
    if (highlights[i] === "active") cls += " active";
    if (highlights[i] === "found") cls += " found";
    var prevAddr = i > 0 ? fakeAddr(nodes[i - 1].id) : "NULL";
    var nextAddr = i < nodes.length - 1 ? fakeAddr(nodes[i + 1].id) : "NULL";
    html2 += '<div class="' + cls + '">' +
      '<div class="prev-part">← ' + prevAddr + '</div>' +
      '<div class="data-part"><span class="ll-val">' + n.val + '</span><span class="ll-addr">' + fakeAddr(n.id) + '</span></div>' +
      '<div class="next-part">→ ' + nextAddr + '</div>' +
      '</div>';
    if (i < nodes.length - 1) html2 += '<div class="ll-arrow">⇄</div>';
  }
  html2 += '<div class="ll-null">→ NULL</div>';
  html2 += '</div></div>';
  return html2;
}

function renderMatrix(mat, highlights, label) {
  highlights = highlights || {};
  var h = '<div><div class="matrix-label">' + (label || "Matrix") + '</div><div class="matrix-grid">';
  for (var r = 0; r < mat.length; r++) {
    h += '<div class="matrix-row">';
    for (var c = 0; c < mat[r].length; c++) {
      var k = r + "," + c;
      var cls = "matrix-cell" + (highlights[k] ? " " + highlights[k] : "");
      h += '<div class="' + cls + '">' + mat[r][c] + '</div>';
    }
    h += '</div>';
  }
  h += '</div></div>';
  return h;
}

function renderString(str, highlights, label) {
  highlights = highlights || {};
  var chars = str.split ? str.split("") : str;
  var h = '<div class="str-row"><div class="str-label">' + (label || "String") + '</div><div class="str-chars">';
  for (var i = 0; i < chars.length; i++) {
    var cls = "str-char" + (highlights[i] ? " " + highlights[i] : "");
    h += '<div class="' + cls + '">' + (chars[i] === " " ? "&nbsp;" : chars[i]) + '</div>';
  }
  h += '</div></div>';
  return h;
}

function renderHash(table) {
  var h = '<div class="hash-wrap">';
  for (var i = 0; i < table.length; i++) {
    var slot = table[i];
    var cls = "hash-slot" + (slot !== null && slot !== undefined ? " filled" : "");
    h += '<div class="' + cls + '" id="hslot-' + i + '">' +
      '<span class="hash-idx">[' + i + ']</span>' +
      '<span class="hash-val">' + (slot !== null && slot !== undefined ? slot : "—") + '</span>' +
      '</div>';
  }
  h += '</div>';
  return h;
}

function caption(msg) { return '<div class="caption">' + msg + '</div>'; }

/* ===== SPEED CONTROL ===== */
function initSpeed() {
  var sr = $("#speedRange");
  var sv = $("#speedValue");
  if (!sr) return;
  sr.addEventListener("input", function() {
    var v = parseInt(sr.value);
    sv.textContent = v;
    app.delay = Math.round(1200 / v);
  });
  app.delay = Math.round(1200 / 5);
}

/* ============================================================
   MODULE: 1D ARRAY LAB
   ============================================================ */
function initArrayLab() {
  $("#moduleTitle").textContent = "1D Array Lab";
  $("#moduleDesc").textContent = "Visualize traversal, insertion, deletion, searching, and reversal on a one-dimensional array.";
  setControls(
    '<div class="ctrl-group"><div class="ctrl-label">Array Values</div>' +
    '<input type="text" id="arrInput" value="10,30,50,20,40,60" placeholder="e.g. 10,20,30" style="width:220px;" /></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Index</div>' +
    '<input type="number" id="arrIdx" value="2" min="0" style="width:70px;" /></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Value</div>' +
    '<input type="number" id="arrVal" value="99" style="width:80px;" /></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Actions</div>' +
    '<div class="btn-row">' +
    '<button class="btn-primary" onclick="loadArr()">Load</button>' +
    '<button onclick="run(traverseArr)">Traversal</button>' +
    '<button onclick="run(insertArr)">Insert</button>' +
    '<button onclick="run(deleteArr)">Delete</button>' +
    '<button onclick="run(linearSearchArr)">Linear Search</button>' +
    '<button onclick="run(reverseArr)">Reverse</button>' +
    '</div></div>'
  );
  loadArr();
}

function loadArr() {
  var nums = parseNums($("#arrInput").value);
  if (!nums.length) { setStatus("Enter at least one number.", "error"); return; }
  app.state.arr = nums;
  show(renderArray(nums));
  setStatus("Array loaded with " + nums.length + " elements.", "success");
  addLog("Array loaded: [" + nums.join(", ") + "]");
}

async function traverseArr() {
  var arr = app.state.arr;
  if (!arr || !arr.length) { setStatus("Load an array first.", "error"); return; }
  addLog("Traversal started");
  for (var i = 0; i < arr.length; i++) {
    var h = {}; h[i] = "active";
    show(renderArray(arr, h, { [i]: ["i=" + i] }));
    setStatus("Visiting index " + i + " → value = " + arr[i], "running");
    await sleep();
  }
  show(renderArray(arr, {}, {}));
  setStatus("Traversal complete. All " + arr.length + " elements visited.", "success");
  addLog("Traversal complete.");
}

async function insertArr() {
  var arr = app.state.arr ? app.state.arr.slice() : [];
  var idx = parseInt($("#arrIdx").value);
  var val = parseInt($("#arrVal").value);
  if (isNaN(idx) || idx < 0 || idx > arr.length) { setStatus("Invalid insertion index (0 to " + arr.length + ").", "error"); return; }
  if (isNaN(val)) { setStatus("Enter a valid value.", "error"); return; }
  addLog("Insert " + val + " at index " + idx);
  arr.push(0);
  for (var i = arr.length - 1; i > idx; i--) {
    arr[i] = arr[i - 1];
    var h = {}; h[i] = "swap"; h[i - 1] = "active";
    show(renderArray(arr, h));
    setStatus("Shifting element from index " + (i-1) + " → " + i, "running");
    await sleep();
  }
  arr[idx] = val;
  var hh = {}; hh[idx] = "found";
  show(renderArray(arr, hh));
  setStatus("Inserted " + val + " at index " + idx, "success");
  addLog("Inserted " + val + " at index " + idx + ". New length: " + arr.length);
  app.state.arr = arr;
}

async function deleteArr() {
  var arr = app.state.arr ? app.state.arr.slice() : [];
  var idx = parseInt($("#arrIdx").value);
  if (isNaN(idx) || idx < 0 || idx >= arr.length) { setStatus("Invalid deletion index (0 to " + (arr.length-1) + ").", "error"); return; }
  var deleted = arr[idx];
  addLog("Delete at index " + idx + " (value=" + deleted + ")");
  var h = {}; h[idx] = "active";
  show(renderArray(arr, h));
  setStatus("Marking index " + idx + " (value=" + deleted + ") for deletion.", "running");
  await sleep();
  for (var i = idx; i < arr.length - 1; i++) {
    arr[i] = arr[i + 1];
    var h2 = {}; h2[i] = "swap"; h2[i + 1] = "active";
    show(renderArray(arr, h2));
    setStatus("Shifting index " + (i+1) + " → " + i, "running");
    await sleep();
  }
  arr.pop();
  show(renderArray(arr));
  setStatus("Deleted value " + deleted + " from index " + idx + ".", "success");
  addLog("Deletion complete. New length: " + arr.length);
  app.state.arr = arr;
}

async function linearSearchArr() {
  var arr = app.state.arr;
  if (!arr || !arr.length) { setStatus("Load array first.", "error"); return; }
  var key = parseInt($("#arrVal").value);
  if (isNaN(key)) { setStatus("Enter a search key.", "error"); return; }
  addLog("Linear search for key=" + key);
  for (var i = 0; i < arr.length; i++) {
    var h = {}; h[i] = "compare";
    show(renderArray(arr, h, { [i]: ["i"] }));
    setStatus("Comparing arr[" + i + "]=" + arr[i] + " with key=" + key, "running");
    await sleep();
    if (arr[i] === key) {
      h[i] = "found";
      show(renderArray(arr, h, { [i]: ["FOUND"] }));
      setStatus("Found " + key + " at index " + i + "!", "success");
      addLog("Found " + key + " at index " + i);
      return;
    }
  }
  show(renderArray(arr));
  setStatus(key + " not found in array.", "warn");
  addLog(key + " not found.");
}

async function reverseArr() {
  var arr = app.state.arr ? app.state.arr.slice() : [];
  if (!arr.length) { setStatus("Load array first.", "error"); return; }
  addLog("Reversing array");
  var left = 0, right = arr.length - 1;
  while (left < right) {
    var h = {}; h[left] = "compare"; h[right] = "compare";
    show(renderArray(arr, h, { [left]: ["L"], [right]: ["R"] }));
    setStatus("Comparing arr[" + left + "]=" + arr[left] + " with arr[" + right + "]=" + arr[right], "running");
    await sleep();
    var tmp = arr[left]; arr[left] = arr[right]; arr[right] = tmp;
    var h2 = {}; h2[left] = "swap"; h2[right] = "swap";
    show(renderArray(arr, h2));
    setStatus("Swapped arr[" + left + "]↔arr[" + right + "]", "running");
    await sleep();
    left++; right--;
  }
  show(renderArray(arr));
  setStatus("Array reversed!", "success");
  addLog("Reversed: [" + arr.join(", ") + "]");
  app.state.arr = arr;
}

/* ============================================================
   MODULE: 2D ARRAY + MATRIX
   ============================================================ */
function initMatrixLab() {
  $("#moduleTitle").textContent = "2D Array + Matrix";
  $("#moduleDesc").textContent = "Visualize 2D array traversal, matrix addition, multiplication, and transpose.";
  setControls(
    '<div class="ctrl-group"><div class="ctrl-label">Matrix A</div>' +
    '<textarea id="matA" rows="3" style="width:180px;">1,2,3;4,5,6;7,8,9</textarea></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Matrix B</div>' +
    '<textarea id="matB" rows="3" style="width:180px;">9,8,7;6,5,4;3,2,1</textarea></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Actions</div>' +
    '<div class="btn-row">' +
    '<button class="btn-primary" onclick="run(traverseMat)">2D Traverse A</button>' +
    '<button onclick="run(addMat)">A + B</button>' +
    '<button onclick="run(mulMat)">A × B</button>' +
    '<button onclick="run(transposeMat)">Transpose A</button>' +
    '</div></div>'
  );
  show('<div class="visual-placeholder">Enter matrices above and choose an operation.</div>');
}

async function traverseMat() {
  var A = parseMatrix($("#matA").value);
  if (!A.length) { setStatus("Enter a valid matrix A.", "error"); return; }
  addLog("Traversing 2D array");
  for (var r = 0; r < A.length; r++) {
    for (var c = 0; c < A[r].length; c++) {
      var h = {}; h[r + "," + c] = "active";
      show('<div class="matrix-wrap">' + renderMatrix(A, h, "Matrix A") + '</div>' + caption("A[" + r + "][" + c + "] = " + A[r][c]));
      setStatus("Visiting A[" + r + "][" + c + "] = " + A[r][c], "running");
      await sleep();
    }
  }
  show('<div class="matrix-wrap">' + renderMatrix(A, {}, "Matrix A") + '</div>');
  setStatus("Traversal complete.", "success");
  addLog("2D traversal done.");
}

async function addMat() {
  var A = parseMatrix($("#matA").value);
  var B = parseMatrix($("#matB").value);
  if (!A.length || !B.length) { setStatus("Enter valid matrices.", "error"); return; }
  if (A.length !== B.length || A[0].length !== B[0].length) {
    setStatus("Matrix addition requires equal dimensions.", "error"); return;
  }
  var C = A.map(function(row, r) { return row.map(function(_, c) { return 0; }); });
  addLog("Matrix addition A+B");
  for (var r = 0; r < A.length; r++) {
    for (var c = 0; c < A[r].length; c++) {
      var hA = {}; hA[r + "," + c] = "active";
      var hB = {}; hB[r + "," + c] = "active";
      var hC = {}; hC[r + "," + c] = "result";
      C[r][c] = A[r][c] + B[r][c];
      show('<div class="matrix-wrap">' +
        renderMatrix(A, hA, "A") + renderMatrix(B, hB, "B") + renderMatrix(C, hC, "C = A+B") +
        '</div>' + caption("C[" + r + "][" + c + "] = A[" + r + "][" + c + "] + B[" + r + "][" + c + "] = " + A[r][c] + " + " + B[r][c] + " = " + C[r][c]));
      setStatus("Computing C[" + r + "][" + c + "]", "running");
      await sleep();
    }
  }
  show('<div class="matrix-wrap">' + renderMatrix(A, {}, "A") + renderMatrix(B, {}, "B") + renderMatrix(C, {}, "Result C") + '</div>');
  setStatus("Matrix addition complete!", "success");
  addLog("Addition complete.");
}

async function mulMat() {
  var A = parseMatrix($("#matA").value);
  var B = parseMatrix($("#matB").value);
  if (!A.length || !B.length) { setStatus("Enter valid matrices.", "error"); return; }
  if (A[0].length !== B.length) {
    setStatus("Matrix multiplication requires columns(A) = rows(B).", "error"); return;
  }
  var C = [];
  for (var r = 0; r < A.length; r++) {
    C.push([]);
    for (var c = 0; c < B[0].length; c++) C[r].push(0);
  }
  addLog("Matrix multiplication A×B");
  for (var r = 0; r < A.length; r++) {
    for (var c = 0; c < B[0].length; c++) {
      var sum = 0;
      for (var k = 0; k < A[0].length; k++) {
        var hA = {}; hA[r + "," + k] = "compare";
        var hB = {}; hB[k + "," + c] = "compare";
        var hC = {}; hC[r + "," + c] = "active";
        sum += A[r][k] * B[k][c];
        C[r][c] = sum;
        show('<div class="matrix-wrap">' +
          renderMatrix(A, hA, "A") + renderMatrix(B, hB, "B") + renderMatrix(C, hC, "C = A×B") +
          '</div>' + caption("C[" + r + "][" + c + "] += A[" + r + "][" + k + "] × B[" + k + "][" + c + "] = " + A[r][k] + " × " + B[k][c] + " → sum=" + sum));
        setStatus("C[" + r + "][" + c + "] += " + A[r][k] + " × " + B[k][c], "running");
        await sleep();
      }
    }
  }
  show('<div class="matrix-wrap">' + renderMatrix(A, {}, "A") + renderMatrix(B, {}, "B") + renderMatrix(C, {}, "Result C") + '</div>');
  setStatus("Matrix multiplication complete!", "success");
  addLog("Multiplication complete.");
}

async function transposeMat() {
  var A = parseMatrix($("#matA").value);
  if (!A.length) { setStatus("Enter a valid matrix A.", "error"); return; }
  var T = [];
  for (var c = 0; c < A[0].length; c++) {
    T.push([]);
    for (var r = 0; r < A.length; r++) T[c].push(0);
  }
  addLog("Transpose A");
  for (var r = 0; r < A.length; r++) {
    for (var c = 0; c < A[r].length; c++) {
      T[c][r] = A[r][c];
      var hA = {}; hA[r + "," + c] = "active";
      var hT = {}; hT[c + "," + r] = "result";
      show('<div class="matrix-wrap">' +
        renderMatrix(A, hA, "A") + renderMatrix(T, hT, "Tᵀ") +
        '</div>' + caption("T[" + c + "][" + r + "] = A[" + r + "][" + c + "] = " + A[r][c]));
      setStatus("Transposing A[" + r + "][" + c + "]", "running");
      await sleep();
    }
  }
  show('<div class="matrix-wrap">' + renderMatrix(A, {}, "Original A") + renderMatrix(T, {}, "Transposed Aᵀ") + '</div>');
  setStatus("Transpose complete!", "success");
  addLog("Transpose done.");
}

/* ============================================================
   MODULE: STACK (ARRAY)
   ============================================================ */
function initStackArray() {
  $("#moduleTitle").textContent = "Stack Using Array";
  $("#moduleDesc").textContent = "Push, pop, and peek operations on an array-backed stack.";
  app.state.stack = { arr: [], cap: 6 };
  setControls(
    '<div class="ctrl-group"><div class="ctrl-label">Capacity</div>' +
    '<input type="number" id="stackCap" value="6" min="1" max="20" style="width:70px;" /></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Value</div>' +
    '<input type="number" id="stackVal" value="42" style="width:80px;" /></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Actions</div>' +
    '<div class="btn-row">' +
    '<button onclick="resetStack()">Reset</button>' +
    '<button class="btn-primary" onclick="run(pushStack)">Push</button>' +
    '<button onclick="run(popStack)">Pop</button>' +
    '<button onclick="run(peekStack)">Peek</button>' +
    '</div></div>'
  );
  resetStack();
}

function resetStack() {
  var cap = parseInt($("#stackCap").value) || 6;
  app.state.stack = { arr: [], cap: cap };
  show(renderStack([], cap));
  setStatus("Stack reset. Capacity = " + cap, "success");
  addLog("Stack reset (cap=" + cap + ")");
}

async function pushStack() {
  var s = app.state.stack;
  var val = parseInt($("#stackVal").value);
  if (isNaN(val)) { setStatus("Enter a valid value.", "error"); return; }
  if (s.arr.length >= s.cap) {
    var h = {}; h[s.arr.length - 1] = "overflow";
    show(renderStack(s.arr, s.cap, h));
    setStatus("Stack Overflow! Cannot push " + val + " (cap=" + s.cap + ").", "error");
    addLog("Stack overflow on push(" + val + ")");
    return;
  }
  s.arr.push(val);
  var h2 = {}; h2[s.arr.length - 1] = "active";
  show(renderStack(s.arr, s.cap, h2));
  setStatus("Pushed " + val + " onto stack. Size=" + s.arr.length, "success");
  addLog("Push(" + val + ") → top=" + val);
  await sleep();
  show(renderStack(s.arr, s.cap));
}

async function popStack() {
  var s = app.state.stack;
  if (s.arr.length === 0) {
    setStatus("Stack Underflow! Cannot pop from empty stack.", "error");
    addLog("Stack underflow on pop.");
    return;
  }
  var topIdx = s.arr.length - 1;
  var h = {}; h[topIdx] = "active";
  show(renderStack(s.arr, s.cap, h));
  setStatus("Popping top element " + s.arr[topIdx] + "...", "running");
  await sleep();
  var popped = s.arr.pop();
  show(renderStack(s.arr, s.cap));
  setStatus("Popped " + popped + ". Size=" + s.arr.length, "success");
  addLog("Pop() → " + popped);
}

async function peekStack() {
  var s = app.state.stack;
  if (s.arr.length === 0) {
    setStatus("Stack is empty — nothing to peek.", "error");
    addLog("Peek: empty stack.");
    return;
  }
  var topIdx = s.arr.length - 1;
  var h = {}; h[topIdx] = "active";
  show(renderStack(s.arr, s.cap, h));
  setStatus("Peek → top = " + s.arr[topIdx], "success");
  addLog("Peek() → " + s.arr[topIdx]);
  await sleep(600);
  show(renderStack(s.arr, s.cap));
}

/* ============================================================
   MODULE: LINEAR QUEUE
   ============================================================ */
function initLinearQueue() {
  $("#moduleTitle").textContent = "Linear Queue Using Array";
  $("#moduleDesc").textContent = "Enqueue and dequeue with FRONT and REAR pointers.";
  app.state.lq = { arr: [], front: -1, rear: -1, cap: 7 };
  setControls(
    '<div class="ctrl-group"><div class="ctrl-label">Capacity</div>' +
    '<input type="number" id="lqCap" value="7" min="1" max="15" style="width:70px;" /></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Value</div>' +
    '<input type="number" id="lqVal" value="10" style="width:80px;" /></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Actions</div>' +
    '<div class="btn-row">' +
    '<button onclick="resetLQ()">Reset</button>' +
    '<button class="btn-primary" onclick="run(enqueueLQ)">Enqueue</button>' +
    '<button onclick="run(dequeueLQ)">Dequeue</button>' +
    '</div></div>'
  );
  resetLQ();
}

function resetLQ() {
  var cap = parseInt($("#lqCap").value) || 7;
  var arr = [];
  for (var i = 0; i < cap; i++) arr.push(undefined);
  app.state.lq = { arr: arr, front: -1, rear: -1, cap: cap };
  show(renderLQView());
  setStatus("Queue reset. Capacity = " + cap, "success");
  addLog("Linear queue reset (cap=" + cap + ")");
}

function renderLQView(highlights) {
  var s = app.state.lq;
  highlights = highlights || {};
  var cells = "";
  for (var i = 0; i < s.cap; i++) {
    var filled = s.front !== -1 && i >= s.front && i <= s.rear;
    var cls = "queue-cell";
    if (!filled) cls += " empty-cell";
    if (highlights[i]) cls += " " + highlights[i];
    var val = filled ? s.arr[i] : " ";
    var ptrs = [];
    if (i === s.front && filled) ptrs.push('<span class="queue-ptr front">FRONT</span>');
    if (i === s.rear && filled) ptrs.push('<span class="queue-ptr rear">REAR</span>');
    cells += '<div class="' + cls + '" style="position:relative;">' + val + ptrs.join("") + '</div>';
  }
  return '<div class="queue-wrap"><div class="queue-cells">' + cells + '</div></div>';
}

async function enqueueLQ() {
  var s = app.state.lq;
  var val = parseInt($("#lqVal").value);
  if (isNaN(val)) { setStatus("Enter a valid value.", "error"); return; }
  if (s.rear >= s.cap - 1) {
    setStatus("Queue Overflow! REAR = " + s.rear + " (cap=" + s.cap + ").", "error");
    addLog("Queue overflow on enqueue(" + val + ")");
    return;
  }
  if (s.front === -1) s.front = 0;
  s.rear++;
  s.arr[s.rear] = val;
  var h = {}; h[s.rear] = "rear-cell";
  show(renderLQView(h));
  setStatus("Enqueued " + val + " at REAR=" + s.rear, "success");
  addLog("Enqueue(" + val + ") → REAR=" + s.rear);
  await sleep();
  show(renderLQView());
}

async function dequeueLQ() {
  var s = app.state.lq;
  if (s.front === -1 || s.front > s.rear) {
    setStatus("Queue Underflow! Queue is empty.", "error");
    addLog("Queue underflow on dequeue.");
    return;
  }
  var h = {}; h[s.front] = "front-cell";
  show(renderLQView(h));
  setStatus("Dequeuing from FRONT=" + s.front + " (value=" + s.arr[s.front] + ")...", "running");
  await sleep();
  var val = s.arr[s.front];
  s.arr[s.front] = undefined;
  if (s.front === s.rear) { s.front = -1; s.rear = -1; }
  else s.front++;
  show(renderLQView());
  setStatus("Dequeued " + val + ". FRONT=" + s.front, "success");
  addLog("Dequeue() → " + val);
}

/* ============================================================
   MODULE: CIRCULAR QUEUE
   ============================================================ */
function initCircularQueue() {
  $("#moduleTitle").textContent = "Circular Queue Using Array";
  $("#moduleDesc").textContent = "Wrap-around queue using (index+1)%capacity formula.";
  app.state.cq = { arr: [], front: -1, rear: -1, cap: 6, size: 0 };
  setControls(
    '<div class="ctrl-group"><div class="ctrl-label">Capacity</div>' +
    '<input type="number" id="cqCap" value="6" min="2" max="12" style="width:70px;" /></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Value</div>' +
    '<input type="number" id="cqVal" value="10" style="width:80px;" /></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Actions</div>' +
    '<div class="btn-row">' +
    '<button onclick="resetCQ()">Reset</button>' +
    '<button class="btn-primary" onclick="run(enqueueCQ)">Enqueue</button>' +
    '<button onclick="run(dequeueCQ)">Dequeue</button>' +
    '</div></div>'
  );
  resetCQ();
}

function resetCQ() {
  var cap = parseInt($("#cqCap").value) || 6;
  var arr = [];
  for (var i = 0; i < cap; i++) arr.push(undefined);
  app.state.cq = { arr: arr, front: -1, rear: -1, cap: cap, size: 0 };
  show(renderCQView());
  setStatus("Circular queue reset. Capacity = " + cap, "success");
  addLog("Circular queue reset (cap=" + cap + ")");
}

function renderCQView(highlights) {
  var s = app.state.cq;
  highlights = highlights || {};
  var cells = "";
  for (var i = 0; i < s.cap; i++) {
    var filled = s.size > 0 && (
      (s.front <= s.rear && i >= s.front && i <= s.rear) ||
      (s.front > s.rear && (i >= s.front || i <= s.rear))
    );
    var cls = "queue-cell";
    if (!filled) cls += " empty-cell";
    if (highlights[i]) cls += " " + highlights[i];
    var val = filled && s.arr[i] !== undefined ? s.arr[i] : " ";
    var ptrs = [];
    if (i === s.front && s.size > 0) ptrs.push('<span class="queue-ptr front">F</span>');
    if (i === s.rear && s.size > 0) ptrs.push('<span class="queue-ptr rear">R</span>');
    cells += '<div class="' + cls + '" style="position:relative;">' + val + ptrs.join("") + '</div>';
  }
  var formula = '<div class="formula" style="margin-top:12px;">next = (index + 1) % ' + s.cap + ' &nbsp;|&nbsp; size = ' + s.size + ' / ' + s.cap + '</div>';
  return '<div class="queue-wrap"><div class="queue-cells">' + cells + '</div>' + formula + '</div>';
}

async function enqueueCQ() {
  var s = app.state.cq;
  var val = parseInt($("#cqVal").value);
  if (isNaN(val)) { setStatus("Enter a valid value.", "error"); return; }
  if (s.size === s.cap) {
    setStatus("Circular Queue Overflow! Full (size=" + s.cap + ").", "error");
    addLog("Circular queue overflow.");
    return;
  }
  if (s.front === -1) { s.front = 0; s.rear = 0; }
  else s.rear = (s.rear + 1) % s.cap;
  s.arr[s.rear] = val;
  s.size++;
  var h = {}; h[s.rear] = "rear-cell";
  show(renderCQView(h));
  setStatus("Enqueued " + val + " at REAR=" + s.rear + " (wrap: (" + (s.rear === 0 ? s.cap - 1 : s.rear - 1) + "+1)%" + s.cap + "=" + s.rear + ")", "success");
  addLog("CQ Enqueue(" + val + ") → REAR=" + s.rear);
  await sleep();
  show(renderCQView());
}

async function dequeueCQ() {
  var s = app.state.cq;
  if (s.size === 0) {
    setStatus("Circular Queue Underflow! Queue is empty.", "error");
    addLog("Circular queue underflow.");
    return;
  }
  var h = {}; h[s.front] = "front-cell";
  show(renderCQView(h));
  setStatus("Dequeuing from FRONT=" + s.front, "running");
  await sleep();
  var val = s.arr[s.front];
  s.arr[s.front] = undefined;
  s.size--;
  if (s.size === 0) { s.front = -1; s.rear = -1; }
  else s.front = (s.front + 1) % s.cap;
  show(renderCQView());
  setStatus("Dequeued " + val + ". FRONT=" + s.front + " size=" + s.size, "success");
  addLog("CQ Dequeue() → " + val);
}

/* ============================================================
   MODULE: SINGLY LINKED LIST
   ============================================================ */
function initLinkedList() {
  $("#moduleTitle").textContent = "Singly Linked List";
  $("#moduleDesc").textContent = "Insert, delete, and display nodes with pointer visualization.";
  app.state.sll = { nodes: [] };
  setControls(
    '<div class="ctrl-group"><div class="ctrl-label">Value</div>' +
    '<input type="number" id="sllVal" value="10" style="width:80px;" /></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Actions</div>' +
    '<div class="btn-row">' +
    '<button onclick="resetSLL()">Reset</button>' +
    '<button class="btn-primary" onclick="run(sllInsertBegin)">Insert Beginning</button>' +
    '<button onclick="run(sllInsertEnd)">Insert End</button>' +
    '<button onclick="run(sllDelete)">Delete Value</button>' +
    '<button onclick="run(sllDisplay)">Display</button>' +
    '</div></div>'
  );
  resetSLL();
}

function resetSLL() {
  app.state.sll = { nodes: [] };
  app.nodeId = 1;
  show(renderSLL([], {}));
  setStatus("Linked list reset.", "success");
  addLog("SLL reset.");
}

async function sllInsertBegin() {
  var val = parseInt($("#sllVal").value);
  if (isNaN(val)) { setStatus("Enter a valid value.", "error"); return; }
  var newNode = { val: val, id: app.nodeId++ };
  app.state.sll.nodes.unshift(newNode);
  var h = {}; h[0] = "active";
  show(renderSLL(app.state.sll.nodes, h));
  setStatus("Inserted " + val + " at beginning. HEAD → " + val, "success");
  addLog("SLL Insert-Begin(" + val + ") at " + fakeAddr(newNode.id));
  await sleep();
  show(renderSLL(app.state.sll.nodes));
}

async function sllInsertEnd() {
  var val = parseInt($("#sllVal").value);
  if (isNaN(val)) { setStatus("Enter a valid value.", "error"); return; }
  var newNode = { val: val, id: app.nodeId++ };
  var nodes = app.state.sll.nodes;
  addLog("SLL Insert-End: traversing to tail...");
  for (var i = 0; i < nodes.length; i++) {
    var h = {}; h[i] = "active";
    show(renderSLL(nodes, h));
    setStatus("Traversing to end... at index " + i, "running");
    await sleep();
  }
  nodes.push(newNode);
  var h2 = {}; h2[nodes.length - 1] = "active";
  show(renderSLL(nodes, h2));
  setStatus("Inserted " + val + " at end.", "success");
  addLog("SLL Insert-End(" + val + ") at " + fakeAddr(newNode.id));
  await sleep();
  show(renderSLL(nodes));
}

async function sllDelete() {
  var val = parseInt($("#sllVal").value);
  if (isNaN(val)) { setStatus("Enter a valid value.", "error"); return; }
  var nodes = app.state.sll.nodes;
  for (var i = 0; i < nodes.length; i++) {
    var h = {}; h[i] = "active";
    show(renderSLL(nodes, h));
    setStatus("Searching for " + val + "... checking node[" + i + "]=" + nodes[i].val, "running");
    await sleep();
    if (nodes[i].val === val) {
      h[i] = "deleted";
      show(renderSLL(nodes, h));
      setStatus("Found " + val + " at index " + i + ". Bypassing...", "running");
      await sleep();
      nodes.splice(i, 1);
      show(renderSLL(nodes));
      setStatus("Deleted node with value " + val + ".", "success");
      addLog("SLL Delete(" + val + ") done.");
      return;
    }
  }
  show(renderSLL(nodes));
  setStatus(val + " not found in list.", "warn");
  addLog("SLL Delete: " + val + " not found.");
}

async function sllDisplay() {
  var nodes = app.state.sll.nodes;
  if (!nodes.length) { setStatus("List is empty.", "warn"); return; }
  for (var i = 0; i < nodes.length; i++) {
    var h = {}; h[i] = "active";
    show(renderSLL(nodes, h));
    setStatus("Visiting node[" + i + "] = " + nodes[i].val + " at " + fakeAddr(nodes[i].id), "running");
    await sleep();
  }
  show(renderSLL(nodes));
  setStatus("Display complete. " + nodes.length + " nodes.", "success");
  addLog("SLL Display: " + nodes.map(function(n) { return n.val; }).join(" → "));
}

/* ============================================================
   MODULE: LINKED STACK
   ============================================================ */
function initLinkedStack() {
  $("#moduleTitle").textContent = "Stack Using Linked List";
  $("#moduleDesc").textContent = "Push inserts at head; pop removes head node.";
  app.state.ls = { nodes: [] };
  setControls(
    '<div class="ctrl-group"><div class="ctrl-label">Value</div>' +
    '<input type="number" id="lsVal" value="10" style="width:80px;" /></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Actions</div>' +
    '<div class="btn-row">' +
    '<button onclick="resetLS()">Reset</button>' +
    '<button class="btn-primary" onclick="run(pushLS)">Push</button>' +
    '<button onclick="run(popLS)">Pop</button>' +
    '<button onclick="run(displayLS)">Display</button>' +
    '</div></div>'
  );
  resetLS();
}

function resetLS() {
  app.state.ls = { nodes: [] };
  show(renderSLL([], {}, "TOP"));
  setStatus("Linked stack reset.", "success");
  addLog("Linked stack reset.");
}

async function pushLS() {
  var val = parseInt($("#lsVal").value);
  if (isNaN(val)) { setStatus("Enter a valid value.", "error"); return; }
  var newNode = { val: val, id: app.nodeId++ };
  app.state.ls.nodes.unshift(newNode);
  var h = {}; h[0] = "active";
  show(renderSLL(app.state.ls.nodes, h, "TOP"));
  setStatus("Pushed " + val + " at TOP.", "success");
  addLog("Linked Stack Push(" + val + ")");
  await sleep();
  show(renderSLL(app.state.ls.nodes, {}, "TOP"));
}

async function popLS() {
  var nodes = app.state.ls.nodes;
  if (!nodes.length) {
    setStatus("Stack Underflow! Linked stack is empty.", "error");
    addLog("Linked stack underflow.");
    return;
  }
  var h = {}; h[0] = "active";
  show(renderSLL(nodes, h, "TOP"));
  setStatus("Popping TOP = " + nodes[0].val + "...", "running");
  await sleep();
  var popped = nodes.shift();
  show(renderSLL(nodes, {}, "TOP"));
  setStatus("Popped " + popped.val + " from stack.", "success");
  addLog("Linked Stack Pop() → " + popped.val);
}

async function displayLS() {
  var nodes = app.state.ls.nodes;
  if (!nodes.length) { setStatus("Stack is empty.", "warn"); return; }
  for (var i = 0; i < nodes.length; i++) {
    var h = {}; h[i] = "active";
    show(renderSLL(nodes, h, "TOP"));
    setStatus("Visiting node " + nodes[i].val, "running");
    await sleep();
  }
  show(renderSLL(nodes, {}, "TOP"));
  setStatus("Display complete.", "success");
  addLog("Linked stack: " + nodes.map(function(n) { return n.val; }).join(" → "));
}

/* ============================================================
   MODULE: SEARCHING
   ============================================================ */
function initSearching() {
  $("#moduleTitle").textContent = "Searching Algorithms";
  $("#moduleDesc").textContent = "Linear Search and Binary Search with step-by-step animation.";
  app.state.searchArr = [];
  setControls(
    '<div class="ctrl-group"><div class="ctrl-label">Array Values</div>' +
    '<input type="text" id="srchInput" value="15,3,42,8,27,64,11,55" placeholder="numbers" style="width:220px;" /></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Search Key</div>' +
    '<input type="number" id="srchKey" value="27" style="width:80px;" /></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Actions</div>' +
    '<div class="btn-row">' +
    '<button class="btn-primary" onclick="loadSearch()">Load</button>' +
    '<button onclick="run(linearSearch)">Linear Search</button>' +
    '<button onclick="run(binarySearch)">Binary Search</button>' +
    '</div></div>'
  );
  loadSearch();
}

function loadSearch() {
  var nums = parseNums($("#srchInput").value);
  if (!nums.length) { setStatus("Enter at least one number.", "error"); return; }
  app.state.searchArr = nums;
  show(renderArray(nums));
  setStatus("Array loaded.", "success");
  addLog("Search array loaded: [" + nums.join(", ") + "]");
}

async function linearSearch() {
  var arr = app.state.searchArr;
  if (!arr.length) { setStatus("Load array first.", "error"); return; }
  var key = parseInt($("#srchKey").value);
  if (isNaN(key)) { setStatus("Enter a search key.", "error"); return; }
  addLog("Linear search for " + key);
  for (var i = 0; i < arr.length; i++) {
    var h = {}; h[i] = "compare";
    for (var j = 0; j < i; j++) h[j] = "inactive";
    show(renderArray(arr, h, { [i]: ["i"] }));
    setStatus("Comparing arr[" + i + "]=" + arr[i] + " with key=" + key, "running");
    await sleep();
    if (arr[i] === key) {
      h[i] = "found";
      show(renderArray(arr, h, { [i]: ["FOUND"] }));
      setStatus("Found " + key + " at index " + i + "! Steps: " + (i + 1), "success");
      addLog("Linear search: found " + key + " at index " + i);
      return;
    }
  }
  show(renderArray(arr));
  setStatus(key + " not found in " + arr.length + " elements.", "warn");
  addLog("Linear search: " + key + " not found.");
}

async function binarySearch() {
  var orig = app.state.searchArr;
  if (!orig.length) { setStatus("Load array first.", "error"); return; }
  var key = parseInt($("#srchKey").value);
  if (isNaN(key)) { setStatus("Enter a search key.", "error"); return; }
  var arr = orig.slice().sort(function(a, b) { return a - b; });
  addLog("Binary search (sorted array): " + arr.join(", "));
  setStatus("Binary search requires sorted data — sorting first.", "running");
  show(renderArray(arr) + caption("Sorted: [" + arr.join(", ") + "]"));
  await sleep(600);
  var lo = 0, hi = arr.length - 1, steps = 0;
  while (lo <= hi) {
    steps++;
    var mid = Math.floor((lo + hi) / 2);
    var h = {};
    for (var x = 0; x < arr.length; x++) {
      if (x < lo || x > hi) h[x] = "inactive";
    }
    h[mid] = "compare";
    show(renderArray(arr, h, { [lo]: ["lo"], [mid]: ["mid"], [hi]: ["hi"] }) +
      caption("lo=" + lo + " mid=" + mid + " hi=" + hi + " | arr[mid]=" + arr[mid] + " key=" + key));
    setStatus("Checking arr[" + mid + "]=" + arr[mid] + " (lo=" + lo + " hi=" + hi + ")", "running");
    await sleep();
    if (arr[mid] === key) {
      h[mid] = "found";
      show(renderArray(arr, h, { [mid]: ["FOUND"] }) + caption("Found " + key + " at index " + mid + " in " + steps + " steps"));
      setStatus("Found " + key + " at index " + mid + "! Steps: " + steps, "success");
      addLog("Binary search: found " + key + " at index " + mid);
      return;
    } else if (arr[mid] < key) { lo = mid + 1; }
    else { hi = mid - 1; }
  }
  show(renderArray(arr));
  setStatus(key + " not found in " + steps + " steps.", "warn");
  addLog("Binary search: " + key + " not found.");
}

/* ============================================================
   MODULE: SORTING
   ============================================================ */
function initSorting() {
  $("#moduleTitle").textContent = "Sorting Algorithms";
  $("#moduleDesc").textContent = "Visualize Bubble, Selection, Insertion, Merge, and Quick Sort.";
  app.state.sortArr = [];
  setControls(
    '<div class="ctrl-group"><div class="ctrl-label">Array Values</div>' +
    '<input type="text" id="sortInput" value="64,34,25,12,22,11,90" placeholder="numbers" style="width:220px;" /></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Actions</div>' +
    '<div class="btn-row">' +
    '<button class="btn-primary" onclick="loadSort()">Load</button>' +
    '<button onclick="run(bubbleSort)">Bubble</button>' +
    '<button onclick="run(selectionSort)">Selection</button>' +
    '<button onclick="run(insertionSort)">Insertion</button>' +
    '<button onclick="run(mergeSort)">Merge</button>' +
    '<button onclick="run(quickSort)">Quick</button>' +
    '</div></div>'
  );
  loadSort();
}

function loadSort() {
  var nums = parseNums($("#sortInput").value);
  if (!nums.length) { setStatus("Enter at least one number.", "error"); return; }
  app.state.sortArr = nums;
  show(renderArray(nums));
  setStatus("Array loaded with " + nums.length + " elements.", "success");
  addLog("Sort array loaded: [" + nums.join(", ") + "]");
}

async function bubbleSort() {
  var arr = app.state.sortArr.slice();
  addLog("Bubble sort started");
  var n = arr.length, swaps = 0;
  for (var i = 0; i < n - 1; i++) {
    for (var j = 0; j < n - i - 1; j++) {
      var h = {}; h[j] = "compare"; h[j + 1] = "compare";
      for (var s = n - i; s < n; s++) h[s] = "sorted";
      show(renderArray(arr, h, { [j]: ["j"], [j+1]: ["j+1"] }) +
        caption("Comparing arr[" + j + "]=" + arr[j] + " and arr[" + (j+1) + "]=" + arr[j+1]));
      setStatus("Comparing " + arr[j] + " > " + arr[j+1] + "?", "running");
      await sleep();
      if (arr[j] > arr[j + 1]) {
        var h2 = {}; h2[j] = "swap"; h2[j + 1] = "swap";
        var tmp = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = tmp;
        swaps++;
        show(renderArray(arr, h2) + caption("Swapped! arr[" + j + "]=" + arr[j] + " ↔ arr[" + (j+1) + "]=" + arr[j+1]));
        setStatus("Swapped " + arr[j + 1] + " ↔ " + arr[j], "running");
        await sleep();
      }
    }
  }
  var hf = {}; for (var i2 = 0; i2 < n; i2++) hf[i2] = "sorted";
  show(renderArray(arr, hf));
  setStatus("Bubble sort complete! " + swaps + " swaps.", "success");
  addLog("Bubble sort done: [" + arr.join(", ") + "] in " + swaps + " swaps");
  app.state.sortArr = arr;
}

async function selectionSort() {
  var arr = app.state.sortArr.slice();
  addLog("Selection sort started");
  var n = arr.length;
  for (var i = 0; i < n - 1; i++) {
    var minIdx = i;
    for (var j = i + 1; j < n; j++) {
      var h = {}; h[i] = "active"; h[j] = "compare"; h[minIdx] = "swap";
      for (var s = 0; s < i; s++) h[s] = "sorted";
      show(renderArray(arr, h, { [minIdx]: ["min"], [j]: ["j"] }) +
        caption("Current min = arr[" + minIdx + "]=" + arr[minIdx] + " | comparing with arr[" + j + "]=" + arr[j]));
      setStatus("Is arr[" + j + "]=" + arr[j] + " < min " + arr[minIdx] + "?", "running");
      await sleep();
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      var h3 = {}; h3[i] = "swap"; h3[minIdx] = "swap";
      var tmp = arr[i]; arr[i] = arr[minIdx]; arr[minIdx] = tmp;
      show(renderArray(arr, h3) + caption("Swapped arr[" + i + "]=" + arr[i] + " with arr[" + minIdx + "]=" + arr[minIdx]));
      setStatus("Placed minimum " + arr[i] + " at index " + i, "running");
      await sleep();
    }
  }
  var hf = {}; for (var i2 = 0; i2 < n; i2++) hf[i2] = "sorted";
  show(renderArray(arr, hf));
  setStatus("Selection sort complete!", "success");
  addLog("Selection sort done: [" + arr.join(", ") + "]");
  app.state.sortArr = arr;
}

async function insertionSort() {
  var arr = app.state.sortArr.slice();
  addLog("Insertion sort started");
  var n = arr.length;
  for (var i = 1; i < n; i++) {
    var key = arr[i];
    var j = i - 1;
    var h = {}; h[i] = "pivot";
    show(renderArray(arr, h, { [i]: ["key=" + key] }) +
      caption("key = arr[" + i + "] = " + key));
    setStatus("Picking key = " + key + " at index " + i, "running");
    await sleep();
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      var h2 = {}; h2[j + 1] = "swap"; h2[j] = "compare";
      show(renderArray(arr, h2) + caption("Shifting arr[" + j + "]=" + arr[j] + " right to index " + (j+1)));
      setStatus("Shifting " + arr[j] + " right", "running");
      await sleep();
      j--;
    }
    arr[j + 1] = key;
    var h3 = {}; h3[j + 1] = "found";
    for (var s = 0; s <= i; s++) if (s !== j + 1) h3[s] = "sorted";
    show(renderArray(arr, h3, { [j + 1]: ["placed"] }) +
      caption("Placed key=" + key + " at index " + (j+1)));
    setStatus("Placed " + key + " at index " + (j + 1), "running");
    await sleep();
  }
  var hf = {}; for (var i2 = 0; i2 < n; i2++) hf[i2] = "sorted";
  show(renderArray(arr, hf));
  setStatus("Insertion sort complete!", "success");
  addLog("Insertion sort done: [" + arr.join(", ") + "]");
  app.state.sortArr = arr;
}

async function mergeSort() {
  var arr = app.state.sortArr.slice();
  addLog("Merge sort started");
  await mergeSortHelper(arr, 0, arr.length - 1);
  var hf = {}; for (var i = 0; i < arr.length; i++) hf[i] = "sorted";
  show(renderArray(arr, hf));
  setStatus("Merge sort complete!", "success");
  addLog("Merge sort done: [" + arr.join(", ") + "]");
  app.state.sortArr = arr;
}

async function mergeSortHelper(arr, lo, hi) {
  if (lo >= hi) return;
  var mid = Math.floor((lo + hi) / 2);
  var h = {};
  for (var x = lo; x <= hi; x++) h[x] = "active";
  show(renderArray(arr, h) + caption("Splitting range [" + lo + "..." + hi + "] at mid=" + mid));
  setStatus("Splitting [" + lo + ".." + mid + "] | [" + (mid+1) + ".." + hi + "]", "running");
  await sleep();
  await mergeSortHelper(arr, lo, mid);
  await mergeSortHelper(arr, mid + 1, hi);
  await merge(arr, lo, mid, hi);
}

async function merge(arr, lo, mid, hi) {
  var left = arr.slice(lo, mid + 1);
  var right = arr.slice(mid + 1, hi + 1);
  var i = 0, j = 0, k = lo;
  while (i < left.length && j < right.length) {
    var h = {}; h[lo + i] = "compare"; h[mid + 1 + j] = "compare"; h[k] = "swap";
    show(renderArray(arr, h) + caption("Merging: left[" + i + "]=" + left[i] + " vs right[" + j + "]=" + right[j]));
    setStatus("Merging [" + lo + ".." + hi + "]", "running");
    await sleep();
    if (left[i] <= right[j]) { arr[k++] = left[i++]; }
    else { arr[k++] = right[j++]; }
  }
  while (i < left.length) arr[k++] = left[i++];
  while (j < right.length) arr[k++] = right[j++];
  var hf = {};
  for (var x = lo; x <= hi; x++) hf[x] = "found";
  show(renderArray(arr, hf) + caption("Merged range [" + lo + ".." + hi + "]: " + arr.slice(lo, hi+1).join(", ")));
  await sleep();
}

async function quickSort() {
  var arr = app.state.sortArr.slice();
  addLog("Quick sort started");
  await quickSortHelper(arr, 0, arr.length - 1);
  var hf = {}; for (var i = 0; i < arr.length; i++) hf[i] = "sorted";
  show(renderArray(arr, hf));
  setStatus("Quick sort complete!", "success");
  addLog("Quick sort done: [" + arr.join(", ") + "]");
  app.state.sortArr = arr;
}

async function quickSortHelper(arr, lo, hi) {
  if (lo >= hi) return;
  var pivot = arr[hi];
  var i = lo - 1;
  var h = {}; h[hi] = "pivot";
  for (var x = lo; x < hi; x++) h[x] = "compare";
  show(renderArray(arr, h, { [hi]: ["pivot=" + pivot] }) + caption("Pivot = arr[" + hi + "] = " + pivot));
  setStatus("Quick sort: pivot=" + pivot + " range [" + lo + ".." + hi + "]", "running");
  await sleep();
  for (var j = lo; j < hi; j++) {
    var h2 = {}; h2[hi] = "pivot"; h2[j] = "compare"; h2[i + 1] = "active";
    show(renderArray(arr, h2) + caption("Is arr[" + j + "]=" + arr[j] + " <= pivot=" + pivot + "?"));
    setStatus("Comparing arr[" + j + "]=" + arr[j] + " with pivot=" + pivot, "running");
    await sleep();
    if (arr[j] <= pivot) {
      i++;
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      var h3 = {}; h3[hi] = "pivot"; h3[i] = "swap"; h3[j] = "swap";
      show(renderArray(arr, h3) + caption("Swapped arr[" + i + "]=" + arr[i] + " ↔ arr[" + j + "]=" + arr[j]));
      setStatus("Swapped " + arr[i] + " ↔ " + arr[j], "running");
      await sleep();
    }
  }
  var pi = i + 1;
  var tmp2 = arr[pi]; arr[pi] = arr[hi]; arr[hi] = tmp2;
  var hf = {}; hf[pi] = "pivot";
  show(renderArray(arr, hf, { [pi]: ["pivot"] }) + caption("Pivot " + pivot + " placed at index " + pi));
  await sleep();
  await quickSortHelper(arr, lo, pi - 1);
  await quickSortHelper(arr, pi + 1, hi);
}

/* ============================================================
   MODULE: STRINGS + PALINDROME
   ============================================================ */
function initStrings() {
  $("#moduleTitle").textContent = "Strings + Palindrome";
  $("#moduleDesc").textContent = "Length, copy, concatenation, and palindrome checking with character-by-character animation.";
  setControls(
    '<div class="ctrl-group"><div class="ctrl-label">String 1</div>' +
    '<input type="text" id="str1" value="Hello" style="width:150px;" /></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">String 2</div>' +
    '<input type="text" id="str2" value="World" style="width:150px;" /></div>' +
    '<div class="ctrl-group"><div class="ctrl-label">Actions</div>' +
    '<div class="btn-row">' +
    '<button class="btn-primary" onclick="run(strLength)">Length</button>' +
    '<button onclick="run(strCopy)">Copy</button>' +
    '<button onclick="run(strConcat)">Concatenate</button>' +
    '<button onclick="run(strPalindrome)">Palindrome</button>' +
    '</div></div>'
  );
  show('<div class="visual-placeholder">Choose a string operation above.</div>');
}

async function strLength() {
  var s = $("#str1").value || "";
  if (!s) { setStatus("Enter a string.", "error"); return; }
  addLog('strlen("' + s + '")');
  var len = 0;
  for (var i = 0; i < s.length; i++) {
    var h = {}; h[i] = "active";
    show('<div class="str-wrap">' + renderString(s, h, "String 1") + caption("Counting index " + i + " → char = '" + s[i] + "' | len = " + (i + 1)) + '</div>');
    setStatus("Counting character '" + s[i] + "' at index " + i + " — length so far: " + (i + 1), "running");
    await sleep();
    len++;
  }
  show('<div class="str-wrap">' + renderString(s, {}, "String 1") + caption('Length of "' + s + '" = ' + len) + '</div>');
  setStatus('strlen("' + s + '") = ' + len, "success");
  addLog("strlen result: " + len);
}

async function strCopy() {
  var src = $("#str1").value || "";
  if (!src) { setStatus("Enter string 1.", "error"); return; }
  addLog('strcpy from "' + src + '"');
  var dest = [];
  for (var i = 0; i < src.length; i++) {
    dest.push(src[i]);
    var hS = {}; hS[i] = "active";
    var hD = {}; for (var j = 0; j <= i; j++) hD[j] = (j === i ? "active" : "found");
    show('<div class="str-wrap">' +
      renderString(src, hS, "Source") +
      renderString(dest, hD, "Destination (copy)") +
      caption("Copying src[" + i + "] = '" + src[i] + "' → dest[" + i + "]") + '</div>');
    setStatus("Copying '" + src[i] + "' to destination index " + i, "running");
    await sleep();
  }
  var destStr = dest.join("");
  show('<div class="str-wrap">' + renderString(src, {}, "Source") + renderString(destStr, {}, "Destination") + caption('Copied: "' + destStr + '"') + '</div>');
  setStatus('strcpy: dest = "' + destStr + '"', "success");
  addLog('strcpy result: "' + destStr + '"');
}

async function strConcat() {
  var s1 = $("#str1").value || "";
  var s2 = $("#str2").value || "";
  if (!s1 || !s2) { setStatus("Enter both strings.", "error"); return; }
  addLog('strcat("' + s1 + '", "' + s2 + '")');
  var result = s1.split("");
  show('<div class="str-wrap">' + renderString(s1, {}, "String 1") + renderString(s2, {}, "String 2") + caption("Concatenating...") + '</div>');
  await sleep();
  for (var i = 0; i < s2.length; i++) {
    result.push(s2[i]);
    var hR = {}; for (var j = 0; j < result.length; j++) hR[j] = j < s1.length ? "found" : (j === result.length - 1 ? "active" : "compare");
    var h2 = {}; h2[i] = "active";
    show('<div class="str-wrap">' +
      renderString(s1, {}, "String 1") +
      renderString(s2, h2, "String 2") +
      renderString(result, hR, "Result") +
      caption("Appending s2[" + i + "] = '" + s2[i] + "'") + '</div>');
    setStatus("Appending '" + s2[i] + "'", "running");
    await sleep();
  }
  var final = result.join("");
  show('<div class="str-wrap">' + renderString(final, {}, "Concatenated Result") + caption('"' + s1 + '" + "' + s2 + '" = "' + final + '"') + '</div>');
  setStatus('strcat result: "' + final + '"', "success");
  addLog('strcat: "' + final + '"');
}

async function strPalindrome() {
  var s = ($("#str1").value || "").toLowerCase();
  if (!s) { setStatus("Enter a string.", "error"); return; }
  addLog('Palindrome check: "' + s + '"');
  var lo = 0, hi = s.length - 1, isPalin = true;
  while (lo <= hi) {
    var h = {}; h[lo] = "compare"; h[hi] = "compare";
    show('<div class="str-wrap">' + renderString(s, h, '"' + s + '"') +
      caption("Comparing s[" + lo + "]='" + s[lo] + "' with s[" + hi + "]='" + s[hi] + "'") + '</div>');
    setStatus("Comparing s[" + lo + "]='" + s[lo] + "' with s[" + hi + "]='" + s[hi] + "'", "running");
    await sleep();
    if (s[lo] !== s[hi]) {
      var hm = {}; hm[lo] = "mismatch"; hm[hi] = "mismatch";
      show('<div class="str-wrap">' + renderString(s, hm, '"' + s + '"') +
        caption("Mismatch! '" + s[lo] + "' ≠ '" + s[hi] + "' → NOT a palindrome") + '</div>');
      isPalin = false;
      break;
    }
    var hf = {}; hf[lo] = "found"; hf[hi] = "found";
    show('<div class="str-wrap">' + renderString(s, hf, '"' + s + '"') +
      caption("Match! '" + s[lo] + "' = '" + s[hi] + "'") + '</div>');
    await sleep();
    lo++; hi--;
  }
  if (isPalin) {
    var hall = {}; for (var i = 0; i < s.length; i++) hall[i] = "found";
    show('<div class="str-wrap">' + renderString(s, hall, '"' + s + '"') +
      caption('"' + s + '" IS a palindrome! ✓') + '</div>');
    setStatus('"' + s + '" is a PALINDROME!', "success");
    addLog('"' + s + '" is a palindrome.');
  } else {
    setStatus('"' + s + '" is NOT a palindrome.', "warn");
    addLog('"' + s + '" is NOT a palindrome.');
  }
}

/* ============================================================
   MODULE: ADVANCED DS/ALGO
   ============================================================ */
function initAdvanced() {
  $("#moduleTitle").textContent = "Advanced Data Structures & Algorithms";
  $("#moduleDesc").textContent = "Priority Queue, Doubly Linked List, Hash Table, Binary Search Tree, Graph BFS/DFS.";
  setControls(
    '<div class="ctrl-group"><div class="ctrl-label">Select Algorithm</div>' +
    '<select id="advSel" onchange="loadAdvControls()">' +
    '<option value="pq">Priority Queue</option>' +
    '<option value="dll">Doubly Linked List</option>' +
    '<option value="hash">Hash Table (Linear Probing)</option>' +
    '<option value="bst">Binary Search Tree</option>' +
    '<option value="graph">Graph BFS / DFS</option>' +
    '</select></div>' +
    '<div id="advControls" style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;"></div>'
  );
  app.state.adv = {};
  loadAdvControls();
}

function loadAdvControls() {
  var sel = $("#advSel") ? $("#advSel").value : "pq";
  var c = $("#advControls");
  if (!c) return;
  app.state.adv = {};
  show('<div class="visual-placeholder">Set up and run the selected algorithm.</div>');

  if (sel === "pq") {
    c.innerHTML =
      '<div class="ctrl-group"><div class="ctrl-label">Value</div><input type="text" id="pqVal" value="Task A" style="width:100px;" /></div>' +
      '<div class="ctrl-group"><div class="ctrl-label">Priority (low=served first)</div><input type="number" id="pqPri" value="1" min="1" style="width:70px;" /></div>' +
      '<div class="btn-row"><button onclick="pqReset()">Reset</button><button class="btn-primary" onclick="run(pqEnqueue)">Enqueue</button><button onclick="run(pqDequeue)">Dequeue</button></div>';
    app.state.adv.pq = [];
    pqRender();
  } else if (sel === "dll") {
    c.innerHTML =
      '<div class="ctrl-group"><div class="ctrl-label">Value</div><input type="number" id="dllVal" value="10" style="width:80px;" /></div>' +
      '<div class="btn-row"><button onclick="dllReset()">Reset</button><button class="btn-primary" onclick="run(dllInsertBegin)">Insert Beginning</button><button onclick="run(dllInsertEnd)">Insert End</button><button onclick="run(dllDelete)">Delete Value</button></div>';
    app.state.adv.dll = [];
    show(renderDLL([], {}));
  } else if (sel === "hash") {
    c.innerHTML =
      '<div class="ctrl-group"><div class="ctrl-label">Key (number)</div><input type="number" id="hashKey" value="42" style="width:80px;" /></div>' +
      '<div class="ctrl-group"><div class="ctrl-label">Table Size</div><input type="number" id="hashSize" value="10" min="2" max="30" style="width:70px;" /></div>' +
      '<div class="btn-row"><button class="btn-primary" onclick="hashNew()">New Table</button><button onclick="run(hashInsert)">Insert</button><button onclick="run(hashSearch)">Search</button></div>';
    hashNew();
  } else if (sel === "bst") {
    c.innerHTML =
      '<div class="ctrl-group"><div class="ctrl-label">Bulk Values</div><input type="text" id="bstBulk" value="50,30,70,20,40,60,80" style="width:180px;" /></div>' +
      '<div class="ctrl-group"><div class="ctrl-label">Single Value</div><input type="number" id="bstVal" value="35" style="width:80px;" /></div>' +
      '<div class="btn-row"><button class="btn-primary" onclick="run(bstBuild)">Build</button><button onclick="run(bstInsert)">Insert</button><button onclick="run(bstSearch)">Search</button><button onclick="run(bstInorder)">Inorder</button><button onclick="bstReset()">Reset</button></div>';
    app.state.adv.bst = null;
    show('<div class="visual-placeholder">Build a BST from bulk values.</div>');
  } else if (sel === "graph") {
    c.innerHTML =
      '<div class="ctrl-group"><div class="ctrl-label">Edges (e.g. A-B,B-C)</div><input type="text" id="graphEdges" value="A-B,A-C,B-D,C-E,D-E,E-F" style="width:220px;" /></div>' +
      '<div class="ctrl-group"><div class="ctrl-label">Start Node</div><input type="text" id="graphStart" value="A" style="width:60px;" /></div>' +
      '<div class="btn-row"><button class="btn-primary" onclick="run(graphBuild)">Build</button><button onclick="run(graphBFS)">BFS</button><button onclick="run(graphDFS)">DFS</button></div>';
    app.state.adv.graph = {};
    show('<div class="visual-placeholder">Enter edges and build the graph.</div>');
  }
}

/* Priority Queue */
function pqReset() { app.state.adv.pq = []; pqRender(); setStatus("Priority queue reset.", "success"); addLog("PQ reset."); }

function pqRender(highlights) {
  highlights = highlights || {};
  var pq = app.state.adv.pq || [];
  if (!pq.length) { show('<div class="pq-wrap"><div style="color:var(--text3);font-family:var(--mono);padding:12px;">Queue is empty.</div></div>'); return; }
  var h = '<div class="pq-wrap">';
  pq.forEach(function(item, i) {
    var cls = "pq-item" + (highlights[i] ? " " + highlights[i] : "");
    h += '<div class="' + cls + '"><span class="pq-priority">Priority: ' + item.priority + '</span><span class="pq-val">' + item.value + '</span></div>';
  });
  h += '</div>';
  show(h);
}

async function pqEnqueue() {
  var val = ($("#pqVal").value || "").trim();
  var pri = parseInt($("#pqPri").value);
  if (!val) { setStatus("Enter a value.", "error"); return; }
  if (isNaN(pri)) { setStatus("Enter a priority.", "error"); return; }
  var pq = app.state.adv.pq;
  pq.push({ value: val, priority: pri });
  pq.sort(function(a, b) { return a.priority - b.priority; });
  var idx = pq.findIndex(function(item) { return item.value === val && item.priority === pri; });
  var h = {}; h[idx] = "active";
  pqRender(h);
  setStatus("Enqueued '" + val + "' with priority " + pri, "success");
  addLog("PQ Enqueue('" + val + "', pri=" + pri + ")");
  await sleep();
  pqRender();
}

async function pqDequeue() {
  var pq = app.state.adv.pq;
  if (!pq.length) { setStatus("Priority queue is empty.", "error"); return; }
  var h = {}; h[0] = "dequeue";
  pqRender(h);
  setStatus("Dequeuing highest priority: '" + pq[0].value + "' (pri=" + pq[0].priority + ")...", "running");
  await sleep();
  var removed = pq.shift();
  pqRender();
  setStatus("Dequeued '" + removed.value + "' (priority=" + removed.priority + ")", "success");
  addLog("PQ Dequeue() → '" + removed.value + "' (pri=" + removed.priority + ")");
}

/* Doubly Linked List */
function dllReset() { app.state.adv.dll = []; show(renderDLL([], {})); setStatus("DLL reset.", "success"); addLog("DLL reset."); }

async function dllInsertBegin() {
  var val = parseInt($("#dllVal").value);
  if (isNaN(val)) { setStatus("Enter a value.", "error"); return; }
  var newNode = { val: val, id: app.nodeId++ };
  app.state.adv.dll.unshift(newNode);
  var h = {}; h[0] = "active";
  show(renderDLL(app.state.adv.dll, h));
  setStatus("Inserted " + val + " at beginning of DLL.", "success");
  addLog("DLL Insert-Begin(" + val + ")");
  await sleep();
  show(renderDLL(app.state.adv.dll, {}));
}

async function dllInsertEnd() {
  var val = parseInt($("#dllVal").value);
  if (isNaN(val)) { setStatus("Enter a value.", "error"); return; }
  var nodes = app.state.adv.dll;
  var newNode = { val: val, id: app.nodeId++ };
  for (var i = 0; i < nodes.length; i++) {
    var h = {}; h[i] = "active";
    show(renderDLL(nodes, h));
    setStatus("Traversing to end... node " + nodes[i].val, "running");
    await sleep();
  }
  nodes.push(newNode);
  var h2 = {}; h2[nodes.length - 1] = "active";
  show(renderDLL(nodes, h2));
  setStatus("Inserted " + val + " at end.", "success");
  addLog("DLL Insert-End(" + val + ")");
  await sleep();
  show(renderDLL(nodes, {}));
}

async function dllDelete() {
  var val = parseInt($("#dllVal").value);
  if (isNaN(val)) { setStatus("Enter a value.", "error"); return; }
  var nodes = app.state.adv.dll;
  for (var i = 0; i < nodes.length; i++) {
    var h = {}; h[i] = "active";
    show(renderDLL(nodes, h));
    setStatus("Searching for " + val + "... at " + nodes[i].val, "running");
    await sleep();
    if (nodes[i].val === val) {
      var h2 = {}; h2[i] = "found";
      show(renderDLL(nodes, h2));
      await sleep();
      nodes.splice(i, 1);
      show(renderDLL(nodes, {}));
      setStatus("Deleted node " + val + " from DLL.", "success");
      addLog("DLL Delete(" + val + ")");
      return;
    }
  }
  setStatus(val + " not found in DLL.", "warn");
  addLog("DLL: " + val + " not found.");
}

/* Hash Table */
function hashNew() {
  var size = parseInt($("#hashSize").value) || 10;
  app.state.adv.hash = new Array(size).fill(null);
  show(renderHash(app.state.adv.hash));
  setStatus("Hash table created with size " + size + ".", "success");
  addLog("Hash table created (size=" + size + ")");
}

async function hashInsert() {
  var key = parseInt($("#hashKey").value);
  var table = app.state.adv.hash;
  if (!table) { setStatus("Create a table first.", "error"); return; }
  if (isNaN(key)) { setStatus("Enter a numeric key.", "error"); return; }
  var size = table.length;
  addLog("Hash insert key=" + key);
  for (var i = 0; i < size; i++) {
    var idx = (key + i) % size;
    // highlight probe
    var t2 = table.slice();
    show(renderHash(t2) + caption("hash(" + key + ", i=" + i + ") = (" + key + " + " + i + ") % " + size + " = " + idx));
    var slot = document.getElementById("hslot-" + idx);
    if (slot) slot.className = "hash-slot probe";
    setStatus("Probing index " + idx + " (i=" + i + ")...", "running");
    await sleep();
    if (table[idx] === null) {
      table[idx] = key;
      show(renderHash(table) + caption("Inserted key=" + key + " at index " + idx));
      var sl2 = document.getElementById("hslot-" + idx);
      if (sl2) sl2.className = "hash-slot filled";
      setStatus("Inserted " + key + " at index " + idx + ".", "success");
      addLog("Inserted " + key + " at hash[" + idx + "]");
      return;
    }
  }
  setStatus("Hash table is full! Cannot insert " + key + ".", "error");
  addLog("Hash table full.");
}

async function hashSearch() {
  var key = parseInt($("#hashKey").value);
  var table = app.state.adv.hash;
  if (!table) { setStatus("Create a table first.", "error"); return; }
  if (isNaN(key)) { setStatus("Enter a numeric key.", "error"); return; }
  var size = table.length;
  addLog("Hash search key=" + key);
  for (var i = 0; i < size; i++) {
    var idx = (key + i) % size;
    var slot = document.getElementById("hslot-" + idx);
    if (slot) slot.className = "hash-slot probe";
    show(renderHash(table) + caption("Probing index " + idx + " (i=" + i + ") → " + (table[idx] !== null ? table[idx] : "empty")));
    setStatus("Probing index " + idx + "...", "running");
    await sleep();
    if (table[idx] === null) {
      show(renderHash(table) + caption(key + " not found (hit empty slot at " + idx + ")"));
      setStatus(key + " not found in hash table.", "warn");
      addLog("Hash search: " + key + " not found.");
      return;
    }
    if (table[idx] === key) {
      var sl2 = document.getElementById("hslot-" + idx);
      if (sl2) sl2.className = "hash-slot found";
      show(renderHash(table) + caption("Found " + key + " at index " + idx + "!"));
      setStatus("Found " + key + " at hash[" + idx + "]!", "success");
      addLog("Hash search: found " + key + " at [" + idx + "]");
      return;
    }
  }
  setStatus(key + " not found.", "warn");
}

/* BST */
function bstReset() { app.state.adv.bst = null; show('<div class="visual-placeholder">Reset — build a BST.</div>'); addLog("BST reset."); }

function bstInsertNode(root, val) {
  if (!root) return { val: val, left: null, right: null };
  if (val < root.val) root.left = bstInsertNode(root.left, val);
  else if (val > root.val) root.right = bstInsertNode(root.right, val);
  return root;
}

function bstRender(root, highlighted) {
  if (!root) { show('<div class="visual-placeholder">BST is empty.</div>'); return; }
  highlighted = highlighted || {};
  var html2 = '<div class="bst-wrap">' + bstNodeHtml(root, highlighted) + '</div>';
  show(html2);
}

function bstNodeHtml(node, highlighted, depth) {
  depth = depth || 0;
  if (!node) return '<div class="bst-node null-node">∅</div>';
  var cls = "bst-node" + (depth === 0 ? " root" : "");
  if (highlighted[node.val] === "active") cls = "bst-node active";
  if (highlighted[node.val] === "found") cls = "bst-node found";
  var h = '<div style="display:flex;flex-direction:column;align-items:center;gap:0;margin:0 4px;">' +
    '<div class="' + cls + '">' + node.val + '</div>';
  if (node.left || node.right) {
    h += '<div style="display:flex;gap:8px;margin-top:4px;">';
    h += bstNodeHtml(node.left, highlighted, depth + 1);
    h += bstNodeHtml(node.right, highlighted, depth + 1);
    h += '</div>';
  }
  h += '</div>';
  return h;
}

async function bstBuild() {
  var vals = parseNums($("#bstBulk").value);
  if (!vals.length) { setStatus("Enter bulk values.", "error"); return; }
  app.state.adv.bst = null;
  addLog("BST build: " + vals.join(", "));
  for (var i = 0; i < vals.length; i++) {
    app.state.adv.bst = bstInsertNode(app.state.adv.bst, vals[i]);
    var h = {}; h[vals[i]] = "active";
    bstRender(app.state.adv.bst, h);
    setStatus("Inserted " + vals[i] + " into BST.", "running");
    await sleep();
    bstRender(app.state.adv.bst, {});
  }
  setStatus("BST built with " + vals.length + " nodes.", "success");
  addLog("BST build complete.");
}

async function bstInsert() {
  var val = parseInt($("#bstVal").value);
  if (isNaN(val)) { setStatus("Enter a value.", "error"); return; }
  if (!app.state.adv.bst) { setStatus("Build BST first.", "error"); return; }
  addLog("BST insert: " + val);
  var node = app.state.adv.bst;
  while (node) {
    var h = {}; h[node.val] = "active";
    bstRender(app.state.adv.bst, h);
    setStatus("At node " + node.val + ": go " + (val < node.val ? "left" : (val > node.val ? "right" : "exists")), "running");
    await sleep();
    if (val === node.val) { setStatus(val + " already exists in BST.", "warn"); return; }
    if (val < node.val) { if (!node.left) break; node = node.left; }
    else { if (!node.right) break; node = node.right; }
  }
  app.state.adv.bst = bstInsertNode(app.state.adv.bst, val);
  var hf = {}; hf[val] = "found";
  bstRender(app.state.adv.bst, hf);
  setStatus("Inserted " + val + " into BST.", "success");
  addLog("BST inserted " + val);
  await sleep();
  bstRender(app.state.adv.bst, {});
}

async function bstSearch() {
  var val = parseInt($("#bstVal").value);
  if (isNaN(val)) { setStatus("Enter a value.", "error"); return; }
  if (!app.state.adv.bst) { setStatus("Build BST first.", "error"); return; }
  addLog("BST search: " + val);
  var node = app.state.adv.bst;
  while (node) {
    var h = {}; h[node.val] = "active";
    bstRender(app.state.adv.bst, h);
    setStatus("At node " + node.val + ": " + (val === node.val ? "FOUND!" : (val < node.val ? "go left" : "go right")), "running");
    await sleep();
    if (val === node.val) {
      var hf = {}; hf[node.val] = "found";
      bstRender(app.state.adv.bst, hf);
      setStatus("Found " + val + " in BST!", "success");
      addLog("BST: found " + val);
      return;
    }
    if (val < node.val) node = node.left;
    else node = node.right;
  }
  bstRender(app.state.adv.bst, {});
  setStatus(val + " not found in BST.", "warn");
  addLog("BST: " + val + " not found.");
}

async function bstInorder() {
  if (!app.state.adv.bst) { setStatus("Build BST first.", "error"); return; }
  var result = [];
  addLog("BST inorder traversal");
  await bstInorderHelper(app.state.adv.bst, result);
  bstRender(app.state.adv.bst, {});
  setStatus("Inorder: [" + result.join(", ") + "]", "success");
  addLog("Inorder result: " + result.join(", "));
}

async function bstInorderHelper(node, result) {
  if (!node) return;
  await bstInorderHelper(node.left, result);
  result.push(node.val);
  var h = {}; h[node.val] = "found";
  bstRender(app.state.adv.bst, h);
  setStatus("Visiting " + node.val + " — inorder so far: [" + result.join(", ") + "]", "running");
  await sleep();
  await bstInorderHelper(node.right, result);
}

/* Graph */
async function graphBuild() {
  var edgesStr = ($("#graphEdges").value || "").trim();
  if (!edgesStr) { setStatus("Enter edges.", "error"); return; }
  var graph = {};
  var edges = edgesStr.split(",");
  for (var i = 0; i < edges.length; i++) {
    var parts = edges[i].trim().split("-");
    if (parts.length !== 2) continue;
    var u = parts[0].trim(), v = parts[1].trim();
    if (!graph[u]) graph[u] = [];
    if (!graph[v]) graph[v] = [];
    if (graph[u].indexOf(v) === -1) graph[u].push(v);
    if (graph[v].indexOf(u) === -1) graph[v].push(u);
  }
  app.state.adv.graph = graph;
  show(renderAdjList(graph, {}));
  setStatus("Graph built with " + Object.keys(graph).length + " nodes.", "success");
  addLog("Graph built: " + Object.keys(graph).join(", "));
}

function renderAdjList(graph, visited, active) {
  visited = visited || {};
  active = active || null;
  var nodes = Object.keys(graph);
  var h = '<div class="graph-wrap"><div class="adj-list">';
  nodes.forEach(function(n) {
    var cls = "adj-entry";
    if (visited[n]) cls += " visited";
    if (n === active) cls += " active";
    h += '<div class="' + cls + '"><span class="adj-vertex">' + n + '</span><span style="color:var(--text3);margin:0 6px;">→</span><span class="adj-neighbors">' + graph[n].join(", ") + '</span></div>';
  });
  h += '</div></div>';
  return h;
}

async function graphBFS() {
  var graph = app.state.adv.graph;
  if (!graph || !Object.keys(graph).length) { setStatus("Build graph first.", "error"); return; }
  var start = ($("#graphStart").value || "").trim();
  if (!graph[start]) { setStatus("Start node '" + start + "' not found in graph.", "error"); return; }
  addLog("BFS from " + start);
  var visited = {}, order = [], queue = [start];
  visited[start] = true;
  while (queue.length) {
    var curr = queue.shift();
    order.push(curr);
    show(renderAdjList(graph, visited, curr) + '<div class="traversal-order">' + order.map(function(n) { return '<span class="trav-node">' + n + '</span>'; }).join(' → ') + '</div>');
    setStatus("BFS visiting: " + curr + " | Order: " + order.join(" → "), "running");
    await sleep();
    visited[curr] = true;
    var neighbors = graph[curr] || [];
    for (var i = 0; i < neighbors.length; i++) {
      if (!visited[neighbors[i]]) {
        visited[neighbors[i]] = true;
        queue.push(neighbors[i]);
      }
    }
  }
  show(renderAdjList(graph, visited, null) + '<div class="traversal-order">' + order.map(function(n) { return '<span class="trav-node">' + n + '</span>'; }).join(' → ') + '</div>');
  setStatus("BFS complete! Order: " + order.join(" → "), "success");
  addLog("BFS order: " + order.join(" → "));
}

async function graphDFS() {
  var graph = app.state.adv.graph;
  if (!graph || !Object.keys(graph).length) { setStatus("Build graph first.", "error"); return; }
  var start = ($("#graphStart").value || "").trim();
  if (!graph[start]) { setStatus("Start node '" + start + "' not found in graph.", "error"); return; }
  addLog("DFS from " + start);
  var visited = {}, order = [];
  async function dfs(node) {
    visited[node] = true;
    order.push(node);
    show(renderAdjList(graph, visited, node) + '<div class="traversal-order">' + order.map(function(n) { return '<span class="trav-node">' + n + '</span>'; }).join(' → ') + '</div>');
    setStatus("DFS visiting: " + node + " | Order: " + order.join(" → "), "running");
    await sleep();
    var neighbors = graph[node] || [];
    for (var i = 0; i < neighbors.length; i++) {
      if (!visited[neighbors[i]]) await dfs(neighbors[i]);
    }
  }
  await dfs(start);
  show(renderAdjList(graph, visited, null) + '<div class="traversal-order">' + order.map(function(n) { return '<span class="trav-node">' + n + '</span>'; }).join(' → ') + '</div>');
  setStatus("DFS complete! Order: " + order.join(" → "), "success");
  addLog("DFS order: " + order.join(" → "));
}

/* ============================================================
   NAVIGATION
   ============================================================ */
var modules = {
  arrayLab:     initArrayLab,
  matrixLab:    initMatrixLab,
  stackArray:   initStackArray,
  linearQueue:  initLinearQueue,
  circularQueue:initCircularQueue,
  linkedList:   initLinkedList,
  linkedStack:  initLinkedStack,
  searching:    initSearching,
  sorting:      initSorting,
  strings:      initStrings,
  advanced:     initAdvanced
};

function selectModule(name) {
  if (app.running) { setStatus("Stop current animation first.", "warn"); return; }
  app.module = name;
  app.state = {};
  clearLog();
  $$(".nav").forEach(function(b) { b.classList.remove("active"); });
  var btn = document.querySelector('.nav[data-module="' + name + '"]');
  if (btn) btn.classList.add("active");
  if (modules[name]) modules[name]();
}

/* ============================================================
   SIDEBAR INTERACTIVITY
   ============================================================ */
function initSidebar() {
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("sidebarOverlay");
  var menuToggle = document.getElementById("menuToggle");
  var collapseBtn = document.getElementById("sidebarCollapseBtn");
  var iconOpen = document.getElementById("menuIconOpen");
  var iconClose = document.getElementById("menuIconClose");

  var isMobile = function() { return window.innerWidth <= 600; };
  var isTablet = function() { return window.innerWidth > 600 && window.innerWidth <= 900; };

  function openMobileSidebar() {
    document.body.classList.add("sidebar-open");
    overlay.classList.add("active");
    if (iconOpen) iconOpen.style.display = "none";
    if (iconClose) iconClose.style.display = "block";
  }

  function closeMobileSidebar() {
    document.body.classList.remove("sidebar-open");
    overlay.classList.remove("active");
    if (iconOpen) iconOpen.style.display = "block";
    if (iconClose) iconClose.style.display = "none";
  }

  function toggleDesktopCollapse() {
    document.body.classList.toggle("sidebar-collapsed");
    var isCollapsed = document.body.classList.contains("sidebar-collapsed");
    try {
      localStorage.setItem("dsav_sidebar_collapsed", isCollapsed ? "1" : "0");
    } catch(e) {}
  }

  // Restore desktop collapse preference
  if (!isMobile()) {
    try {
      var saved = localStorage.getItem("dsav_sidebar_collapsed");
      if (saved === "1") document.body.classList.add("sidebar-collapsed");
    } catch(e) {}
  }

  // Menu toggle button (hamburger)
  if (menuToggle) {
    menuToggle.addEventListener("click", function() {
      if (isMobile()) {
        if (document.body.classList.contains("sidebar-open")) {
          closeMobileSidebar();
        } else {
          openMobileSidebar();
        }
      } else {
        toggleDesktopCollapse();
      }
    });
  }

  // Desktop collapse button (inside sidebar)
  if (collapseBtn) {
    collapseBtn.addEventListener("click", function() {
      if (!isMobile()) toggleDesktopCollapse();
    });
  }

  // Overlay click closes mobile sidebar
  if (overlay) {
    overlay.addEventListener("click", closeMobileSidebar);
  }

  // Close mobile sidebar on nav item click
  $$(".nav").forEach(function(btn) {
    btn.addEventListener("click", function() {
      if (isMobile()) closeMobileSidebar();
    });
  });

  // Handle resize — clean up states when crossing breakpoints
  var resizeTimer;
  window.addEventListener("resize", function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      if (!isMobile()) {
        closeMobileSidebar();
      }
    }, 100);
  });

  // Clear log button
  var clearLogBtn = document.getElementById("clearLogBtn");
  if (clearLogBtn) {
    clearLogBtn.addEventListener("click", function() {
      clearLog();
      setStatus("Log cleared.", "info");
    });
  }
}

/* ============================================================
   BOOT
   ============================================================ */
function boot() {
  initSpeed();
  initSidebar();
  $$(".nav").forEach(function(btn) {
    btn.addEventListener("click", function() {
      selectModule(this.getAttribute("data-module"));
    });
  });
  selectModule("arrayLab");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
