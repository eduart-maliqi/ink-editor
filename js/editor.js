(() => {
  'use strict';

  // State
  let tabs = [];
  let activeTabId = null;
  let tabCounter = 0;

  // DOM
  const $ = (s) => document.querySelector(s);
  const editor = $('#editor');
  const gutter = $('#gutter');
  const tabsEl = $('#tabs');
  const findBar = $('#findBar');
  const findInput = $('#findInput');
  const replaceInput = $('#replaceInput');
  const findCountEl = $('#findCount');
  const cursorPos = $('#cursorPos');
  const wordCount = $('#wordCount');
  const statusEl = $('#status');

  // Theme
  function loadTheme() {
    const theme = localStorage.getItem('ink-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ink-theme', next);
  }

  // Tabs
  function createTab(title, content = '') {
    const id = ++tabCounter;
    const tab = {
      id,
      title: title || `Untitled-${id}`,
      content,
      savedContent: content,
      scrollTop: 0,
      scrollLeft: 0,
      selectionStart: 0,
      selectionEnd: 0,
    };
    tabs.push(tab);
    switchTab(id);
    renderTabs();
    saveTabs();
    return tab;
  }

  function closeTab(id) {
    const idx = tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;

    const tab = tabs[idx];
    if (tab.content !== tab.savedContent) {
      if (!confirm(`"${tab.title}" has unsaved changes. Close anyway?`)) return;
    }

    tabs.splice(idx, 1);

    if (tabs.length === 0) {
      createTab();
      return;
    }

    if (activeTabId === id) {
      const newIdx = Math.min(idx, tabs.length - 1);
      switchTab(tabs[newIdx].id);
    }

    renderTabs();
    saveTabs();
  }

  function switchTab(id) {
    // Save current tab state
    if (activeTabId !== null) {
      const current = tabs.find((t) => t.id === activeTabId);
      if (current) {
        current.content = editor.value;
        current.scrollTop = editor.scrollTop;
        current.scrollLeft = editor.scrollLeft;
        current.selectionStart = editor.selectionStart;
        current.selectionEnd = editor.selectionEnd;
      }
    }

    activeTabId = id;
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;

    editor.value = tab.content;
    editor.scrollTop = tab.scrollTop;
    editor.scrollLeft = tab.scrollLeft;
    editor.selectionStart = tab.selectionStart;
    editor.selectionEnd = tab.selectionEnd;
    editor.focus();

    updateLineNumbers();
    updateCursorPosition();
    updateWordCount();
    renderTabs();
  }

  function renderTabs() {
    tabsEl.innerHTML = '';
    tabs.forEach((tab) => {
      const el = document.createElement('div');
      el.className = `tab${tab.id === activeTabId ? ' active' : ''}${tab.content !== tab.savedContent ? ' modified' : ''}`;
      el.innerHTML = `<span class="tab-title">${escapeHtml(tab.title)}</span><span class="tab-close">&times;</span>`;

      el.querySelector('.tab-title').addEventListener('click', () => switchTab(tab.id));
      el.querySelector('.tab-title').addEventListener('dblclick', () => renameTab(tab.id));
      el.querySelector('.tab-close').addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(tab.id);
      });

      tabsEl.appendChild(el);
    });
  }

  function renameTab(id) {
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;
    const name = prompt('Rename tab:', tab.title);
    if (name && name.trim()) {
      tab.title = name.trim();
      renderTabs();
      saveTabs();
    }
  }

  // Line numbers
  function updateLineNumbers() {
    const lines = editor.value.split('\n');
    const count = lines.length;
    const currentLine = editor.value.substring(0, editor.selectionStart).split('\n').length;

    let html = '';
    for (let i = 1; i <= count; i++) {
      html += `<span class="line-number${i === currentLine ? ' active' : ''}">${i}</span>`;
    }
    gutter.innerHTML = html;
  }

  // Sync gutter scroll with editor
  function syncGutterScroll() {
    gutter.scrollTop = editor.scrollTop;
  }

  // Cursor position
  function updateCursorPosition() {
    const text = editor.value.substring(0, editor.selectionStart);
    const lines = text.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    cursorPos.textContent = `Ln ${line}, Col ${col}`;
  }

  // Word count
  function updateWordCount() {
    const text = editor.value;
    const chars = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}, ${chars} char${chars !== 1 ? 's' : ''}`;
  }

  // Find & Replace
  let findMatches = [];
  let findIndex = -1;

  function performFind() {
    const query = findInput.value;
    if (!query) {
      findMatches = [];
      findIndex = -1;
      findCountEl.textContent = '';
      return;
    }

    const text = editor.value;
    findMatches = [];
    let idx = text.indexOf(query);
    while (idx !== -1) {
      findMatches.push(idx);
      idx = text.indexOf(query, idx + 1);
    }

    findCountEl.textContent = findMatches.length > 0
      ? `${findMatches.length} found`
      : 'No results';

    if (findMatches.length > 0) {
      findIndex = 0;
      highlightMatch();
    }
  }

  function highlightMatch() {
    if (findMatches.length === 0) return;
    const pos = findMatches[findIndex];
    const query = findInput.value;
    editor.focus();
    editor.selectionStart = pos;
    editor.selectionEnd = pos + query.length;

    // Scroll into view
    const textBefore = editor.value.substring(0, pos);
    const lineNumber = textBefore.split('\n').length;
    const lineHeight = parseFloat(getComputedStyle(editor).lineHeight);
    editor.scrollTop = (lineNumber - 5) * lineHeight;

    findCountEl.textContent = `${findIndex + 1}/${findMatches.length}`;
  }

  function findNext() {
    if (findMatches.length === 0) return;
    findIndex = (findIndex + 1) % findMatches.length;
    highlightMatch();
  }

  function findPrev() {
    if (findMatches.length === 0) return;
    findIndex = (findIndex - 1 + findMatches.length) % findMatches.length;
    highlightMatch();
  }

  function replaceOne() {
    if (findMatches.length === 0) return;
    const pos = findMatches[findIndex];
    const query = findInput.value;
    const replacement = replaceInput.value;
    const text = editor.value;

    editor.value = text.substring(0, pos) + replacement + text.substring(pos + query.length);
    onEditorInput();
    performFind();
  }

  function replaceAll() {
    const query = findInput.value;
    if (!query) return;
    const replacement = replaceInput.value;
    editor.value = editor.value.split(query).join(replacement);
    onEditorInput();
    performFind();
  }

  function toggleFindBar() {
    findBar.classList.toggle('hidden');
    if (!findBar.classList.contains('hidden')) {
      const selected = editor.value.substring(editor.selectionStart, editor.selectionEnd);
      if (selected) findInput.value = selected;
      findInput.focus();
      findInput.select();
    }
  }

  // Auto-save to localStorage
  function saveTabs() {
    const current = tabs.find((t) => t.id === activeTabId);
    if (current) {
      current.content = editor.value;
    }

    const data = tabs.map((t) => ({
      id: t.id,
      title: t.title,
      content: t.content,
      savedContent: t.savedContent,
    }));

    localStorage.setItem('ink-tabs', JSON.stringify(data));
    localStorage.setItem('ink-activeTab', activeTabId);
    localStorage.setItem('ink-tabCounter', tabCounter);
  }

  function loadTabs() {
    try {
      const data = JSON.parse(localStorage.getItem('ink-tabs'));
      const savedActiveTab = parseInt(localStorage.getItem('ink-activeTab'), 10);
      tabCounter = parseInt(localStorage.getItem('ink-tabCounter'), 10) || 0;

      if (data && data.length > 0) {
        tabs = data.map((t) => ({
          ...t,
          scrollTop: 0,
          scrollLeft: 0,
          selectionStart: 0,
          selectionEnd: 0,
        }));

        const targetTab = tabs.find((t) => t.id === savedActiveTab) || tabs[0];
        activeTabId = null;
        switchTab(targetTab.id);
        return;
      }
    } catch (e) {
      // Ignore parse errors
    }

    createTab();
  }

  function showSaveStatus() {
    statusEl.textContent = 'Saved';
    setTimeout(() => {
      statusEl.textContent = '';
    }, 1500);
  }

  // Tab key handling
  function handleTab(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;

      if (start === end) {
        // Insert two spaces
        const before = editor.value.substring(0, start);
        const after = editor.value.substring(end);
        editor.value = before + '  ' + after;
        editor.selectionStart = editor.selectionEnd = start + 2;
      } else {
        // Indent/unindent selected lines
        const text = editor.value;
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = text.indexOf('\n', end);
        const actualEnd = lineEnd === -1 ? text.length : lineEnd;
        const selectedLines = text.substring(lineStart, actualEnd);

        let newLines;
        if (e.shiftKey) {
          newLines = selectedLines.replace(/^  /gm, '');
        } else {
          newLines = selectedLines.replace(/^/gm, '  ');
        }

        editor.value = text.substring(0, lineStart) + newLines + text.substring(actualEnd);
        editor.selectionStart = lineStart;
        editor.selectionEnd = lineStart + newLines.length;
      }

      onEditorInput();
    }
  }

  // Auto-close brackets
  const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };

  function handleAutoPair(e) {
    const char = e.key;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;

    if (PAIRS[char]) {
      const closing = PAIRS[char];

      if (start !== end) {
        // Wrap selection
        e.preventDefault();
        const selected = editor.value.substring(start, end);
        const before = editor.value.substring(0, start);
        const after = editor.value.substring(end);
        editor.value = before + char + selected + closing + after;
        editor.selectionStart = start + 1;
        editor.selectionEnd = end + 1;
        onEditorInput();
        return;
      }

      // Auto-close
      if (char === closing && editor.value[start] === closing) {
        // Skip over existing closing char
        e.preventDefault();
        editor.selectionStart = editor.selectionEnd = start + 1;
        return;
      }

      e.preventDefault();
      const before = editor.value.substring(0, start);
      const after = editor.value.substring(end);
      editor.value = before + char + closing + after;
      editor.selectionStart = editor.selectionEnd = start + 1;
      onEditorInput();
    }

    // Handle backspace for paired chars
    if (e.key === 'Backspace' && start === end && start > 0) {
      const prev = editor.value[start - 1];
      const next = editor.value[start];
      if (PAIRS[prev] && PAIRS[prev] === next) {
        e.preventDefault();
        const before = editor.value.substring(0, start - 1);
        const after = editor.value.substring(start + 1);
        editor.value = before + after;
        editor.selectionStart = editor.selectionEnd = start - 1;
        onEditorInput();
      }
    }

    // Handle Enter for auto-indent
    if (e.key === 'Enter') {
      const text = editor.value;
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const currentLine = text.substring(lineStart, start);
      const indent = currentLine.match(/^\s*/)[0];

      const prevChar = text[start - 1];
      const nextChar = text[start];

      if ((prevChar === '{' && nextChar === '}') || (prevChar === '(' && nextChar === ')') || (prevChar === '[' && nextChar === ']')) {
        e.preventDefault();
        const newIndent = indent + '  ';
        const insertion = '\n' + newIndent + '\n' + indent;
        const before = text.substring(0, start);
        const after = text.substring(start);
        editor.value = before + insertion + after;
        editor.selectionStart = editor.selectionEnd = start + 1 + newIndent.length;
        onEditorInput();
        return;
      }

      if (indent) {
        e.preventDefault();
        const before = text.substring(0, start);
        const after = text.substring(end);
        editor.value = before + '\n' + indent + after;
        editor.selectionStart = editor.selectionEnd = start + 1 + indent.length;
        onEditorInput();
      }
    }
  }

  // Editor input handler
  function onEditorInput() {
    updateLineNumbers();
    updateCursorPosition();
    updateWordCount();
    renderTabs();
    debouncedSave();
  }

  // Debounced save
  let saveTimeout;
  function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveTabs();
      showSaveStatus();
    }, 500);
  }

  // Keyboard shortcuts
  function handleShortcuts(e) {
    const mod = e.ctrlKey || e.metaKey;

    if (mod && e.key === 'n') {
      e.preventDefault();
      createTab();
    }
    if (mod && e.key === 'w') {
      e.preventDefault();
      closeTab(activeTabId);
    }
    if (mod && e.key === 'h') {
      e.preventDefault();
      toggleFindBar();
    }
    if (mod && e.key === 's') {
      e.preventDefault();
      const tab = tabs.find((t) => t.id === activeTabId);
      if (tab) {
        tab.content = editor.value;
        tab.savedContent = editor.value;
        saveTabs();
        renderTabs();
        showSaveStatus();
      }
    }
    // Switch tabs with Ctrl+Tab
    if (mod && e.key === 'Tab') {
      e.preventDefault();
      const idx = tabs.findIndex((t) => t.id === activeTabId);
      const next = e.shiftKey
        ? (idx - 1 + tabs.length) % tabs.length
        : (idx + 1) % tabs.length;
      switchTab(tabs[next].id);
    }

    if (e.key === 'Escape' && !findBar.classList.contains('hidden')) {
      findBar.classList.add('hidden');
      editor.focus();
    }
  }

  // Utility
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Event listeners
  editor.addEventListener('input', onEditorInput);
  editor.addEventListener('click', () => {
    updateCursorPosition();
    updateLineNumbers();
  });
  editor.addEventListener('keyup', () => {
    updateCursorPosition();
    updateLineNumbers();
  });
  editor.addEventListener('keydown', handleTab);
  editor.addEventListener('keydown', handleAutoPair);
  editor.addEventListener('scroll', syncGutterScroll);

  document.addEventListener('keydown', handleShortcuts);

  $('#addTab').addEventListener('click', () => createTab());
  $('#toggleTheme').addEventListener('click', toggleTheme);
  $('#toggleFind').addEventListener('click', toggleFindBar);

  findInput.addEventListener('input', performFind);
  $('#findNext').addEventListener('click', findNext);
  $('#findPrev').addEventListener('click', findPrev);
  $('#replaceOne').addEventListener('click', replaceOne);
  $('#replaceAll').addEventListener('click', replaceAll);
  $('#closeFind').addEventListener('click', () => {
    findBar.classList.add('hidden');
    editor.focus();
  });

  findInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.shiftKey ? findPrev() : findNext();
    }
    if (e.key === 'Escape') {
      findBar.classList.add('hidden');
      editor.focus();
    }
  });

  // Init
  loadTheme();
  loadTabs();
  editor.focus();
})();
