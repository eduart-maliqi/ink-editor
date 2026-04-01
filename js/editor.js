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
  const sidebar = $('#sidebar');
  const fileTree = $('#fileTree');
  const sidebarTitle = $('#sidebarTitle');
  const terminalPanel = $('#terminalPanel');
  const terminalOutput = $('#terminalOutput');
  const fileLanguage = $('#fileLanguage');
  const javaStatusEl = $('#javaStatus');

  // Language detection
  const EXT_LANGUAGES = {
    '.java': 'Java',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (JSX)',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript (TSX)',
    '.py': 'Python',
    '.html': 'HTML',
    '.htm': 'HTML',
    '.css': 'CSS',
    '.json': 'JSON',
    '.xml': 'XML',
    '.svg': 'SVG',
    '.md': 'Markdown',
    '.c': 'C',
    '.cpp': 'C++',
    '.h': 'C Header',
    '.hpp': 'C++ Header',
    '.cs': 'C#',
    '.txt': 'Plain Text',
    '.log': 'Log',
    '.csv': 'CSV',
    '.ini': 'INI',
    '.cfg': 'Config',
    '.conf': 'Config',
    '.env': 'Environment',
    '.sh': 'Shell',
    '.bat': 'Batch',
    '.ps1': 'PowerShell',
    '.sql': 'SQL',
    '.yml': 'YAML',
    '.yaml': 'YAML',
    '.toml': 'TOML',
    '.rs': 'Rust',
    '.go': 'Go',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.swift': 'Swift',
    '.kt': 'Kotlin',
    '.scala': 'Scala',
    '.properties': 'Properties',
    '.gradle': 'Gradle',
    '.gitignore': 'Git Ignore',
    '.editorconfig': 'EditorConfig',
    '.dockerfile': 'Dockerfile',
  };

  function getLanguage(filename) {
    if (!filename) return 'Plain Text';
    const ext = '.' + filename.split('.').pop().toLowerCase();
    return EXT_LANGUAGES[ext] || 'Plain Text';
  }

  // File icons for tree
  function getFileIcon(name, type) {
    if (type === 'directory') return '\u{1F4C1}';
    const ext = name.split('.').pop().toLowerCase();
    const icons = {
      java: '\u2615',
      js: '\u{1F7E8}',
      jsx: '\u{1F7E8}',
      ts: '\u{1F7E6}',
      tsx: '\u{1F7E6}',
      py: '\u{1F40D}',
      html: '\u{1F310}',
      htm: '\u{1F310}',
      css: '\u{1F3A8}',
      json: '\u{1F4CB}',
      md: '\u{1F4DD}',
      txt: '\u{1F4C4}',
      log: '\u{1F4C3}',
      xml: '\u{1F4C4}',
      svg: '\u{1F5BC}',
      yml: '\u2699',
      yaml: '\u2699',
      sh: '\u{1F4DF}',
      bat: '\u{1F4DF}',
      sql: '\u{1F5C3}',
      csv: '\u{1F4CA}',
      ini: '\u2699',
      cfg: '\u2699',
      conf: '\u2699',
      env: '\u{1F510}',
      gitignore: '\u{1F6AB}',
    };
    return icons[ext] || '\u{1F4C4}';
  }

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
  function createTab(title, content = '', filePath = null) {
    const id = ++tabCounter;
    const tab = {
      id,
      title: title || `Untitled-${id}`,
      content,
      savedContent: content,
      filePath,
      scrollTop: 0,
      scrollLeft: 0,
      selectionStart: 0,
      selectionEnd: 0,
    };
    tabs.push(tab);
    switchTab(id);
    renderTabs();
    saveState();
    return tab;
  }

  function openFileInTab(filePath, content) {
    // Check if file is already open
    const existing = tabs.find((t) => t.filePath === filePath);
    if (existing) {
      switchTab(existing.id);
      return;
    }

    const name = filePath.split(/[/\\]/).pop();
    createTab(name, content, filePath);
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
    saveState();
  }

  function switchTab(id) {
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

    // Update language display
    fileLanguage.textContent = getLanguage(tab.title);

    // Update window title
    const title = tab.filePath ? `${tab.title} - ${tab.filePath}` : tab.title;
    document.title = `${title} - Ink Editor`;

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
      saveState();
    }
  }

  // File operations
  async function saveCurrentFile() {
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return;

    tab.content = editor.value;

    if (tab.filePath) {
      const result = await window.inkAPI.saveFile(tab.filePath, tab.content);
      if (result.success) {
        tab.savedContent = tab.content;
        renderTabs();
        showSaveStatus();
      } else {
        terminalLog(`Error saving file: ${result.error}`, 'error');
      }
    } else {
      await saveCurrentFileAs();
    }
  }

  async function saveCurrentFileAs() {
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return;

    tab.content = editor.value;
    const result = await window.inkAPI.saveFileAs(tab.content, tab.title);

    if (result.success) {
      tab.filePath = result.filePath;
      tab.title = result.filePath.split(/[/\\]/).pop();
      tab.savedContent = tab.content;
      fileLanguage.textContent = getLanguage(tab.title);
      renderTabs();
      showSaveStatus();
    }
  }

  // File tree
  function renderFileTree(entries, container, depth = 0) {
    entries.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'tree-item';
      item.style.paddingLeft = `${12 + depth * 16}px`;
      item.innerHTML = `<span class="icon">${getFileIcon(entry.name, entry.type)}</span>${escapeHtml(entry.name)}`;

      if (entry.type === 'directory') {
        const children = document.createElement('div');
        children.className = 'tree-children';

        item.addEventListener('click', () => {
          children.classList.toggle('open');
          item.querySelector('.icon').textContent = children.classList.contains('open') ? '\u{1F4C2}' : '\u{1F4C1}';
        });

        container.appendChild(item);

        if (entry.children && entry.children.length > 0) {
          renderFileTree(entry.children, children, depth + 1);
        }
        container.appendChild(children);
      } else {
        item.addEventListener('click', async () => {
          const result = await window.inkAPI.readFile(entry.path);
          if (result.success) {
            openFileInTab(entry.path, result.content);
          } else {
            terminalLog(`Error reading file: ${result.error}`, 'error');
          }
        });
        container.appendChild(item);
      }
    });
  }

  // Terminal
  function terminalLog(message, type = '') {
    showTerminal();
    const span = document.createElement('span');
    if (type) span.className = `out-${type}`;
    span.textContent = message + '\n';
    terminalOutput.appendChild(span);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function clearTerminal() {
    terminalOutput.innerHTML = '';
  }

  function showTerminal() {
    terminalPanel.classList.remove('hidden');
  }

  function toggleTerminal() {
    terminalPanel.classList.toggle('hidden');
  }

  // Java compiler
  async function compileJava() {
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return;

    if (!tab.title.endsWith('.java')) {
      terminalLog('Current file is not a Java file. Save it as .java first.', 'warning');
      return;
    }

    // Auto-save before compiling
    if (!tab.filePath) {
      terminalLog('Please save the file first (Ctrl+S).', 'warning');
      return;
    }

    tab.content = editor.value;
    await window.inkAPI.saveFile(tab.filePath, tab.content);
    tab.savedContent = tab.content;
    renderTabs();

    clearTerminal();
    terminalLog(`Compiling ${tab.title}...`, 'info');

    const result = await window.inkAPI.compileJava(tab.filePath);

    if (result.success) {
      terminalLog('Compilation successful!', 'success');
    } else {
      terminalLog('Compilation failed:', 'error');
      if (result.stderr) terminalLog(result.stderr, 'error');
    }

    return result.success;
  }

  async function runJava() {
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab || !tab.filePath || !tab.title.endsWith('.java')) {
      terminalLog('No compiled Java file to run.', 'warning');
      return;
    }

    terminalLog(`\nRunning ${tab.title.replace('.java', '')}...`, 'info');
    terminalLog('---', 'info');

    const result = await window.inkAPI.runJava(tab.filePath);

    terminalLog('---', 'info');
    if (result.success) {
      terminalLog(`Process exited with code ${result.exitCode}`, 'success');
    } else {
      if (result.stderr) terminalLog(result.stderr, 'error');
      terminalLog(`Process exited with code ${result.exitCode}`, 'error');
    }
  }

  async function compileAndRunJava() {
    const success = await compileJava();
    if (success) {
      await runJava();
    }
  }

  // Check Java installation
  async function checkJava() {
    const result = await window.inkAPI.checkJava();
    if (result.installed) {
      javaStatusEl.textContent = result.version;
    } else {
      javaStatusEl.textContent = 'Java not found';
      javaStatusEl.style.color = 'var(--warning)';
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

  // State persistence
  function saveState() {
    const current = tabs.find((t) => t.id === activeTabId);
    if (current) {
      current.content = editor.value;
    }

    const data = tabs.map((t) => ({
      id: t.id,
      title: t.title,
      content: t.content,
      savedContent: t.savedContent,
      filePath: t.filePath,
    }));

    localStorage.setItem('ink-tabs', JSON.stringify(data));
    localStorage.setItem('ink-activeTab', activeTabId);
    localStorage.setItem('ink-tabCounter', tabCounter);
  }

  function loadState() {
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
      // Ignore
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
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;

      if (start === end) {
        const before = editor.value.substring(0, start);
        const after = editor.value.substring(end);
        editor.value = before + '  ' + after;
        editor.selectionStart = editor.selectionEnd = start + 2;
      } else {
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

      if (char === closing && editor.value[start] === closing) {
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

  let saveTimeout;
  function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveState();
    }, 500);
  }

  // Keyboard shortcuts
  function handleShortcuts(e) {
    const mod = e.ctrlKey || e.metaKey;

    if (mod && e.key === 'n') {
      e.preventDefault();
      createTab();
    }
    if (mod && e.key === 'o' && !e.shiftKey) {
      e.preventDefault();
      window.inkAPI.openFile();
    }
    if (mod && e.shiftKey && e.key === 'O') {
      e.preventDefault();
      window.inkAPI.openFolder();
    }
    if (mod && e.key === 'w') {
      e.preventDefault();
      closeTab(activeTabId);
    }
    if (mod && e.key === 'h') {
      e.preventDefault();
      toggleFindBar();
    }
    if (mod && e.key === 's' && !e.shiftKey) {
      e.preventDefault();
      saveCurrentFile();
    }
    if (mod && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      saveCurrentFileAs();
    }
    if (mod && e.key === 'b') {
      e.preventDefault();
      compileJava();
    }
    if (mod && e.key === 'r') {
      e.preventDefault();
      runJava();
    }
    if (e.key === 'F5') {
      e.preventDefault();
      compileAndRunJava();
    }
    if (mod && e.key === '`') {
      e.preventDefault();
      toggleTerminal();
    }
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

  // Terminal resize
  function initTerminalResize() {
    const handle = $('#terminalResize');
    let startY, startHeight;

    handle.addEventListener('mousedown', (e) => {
      startY = e.clientY;
      startHeight = terminalPanel.offsetHeight;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    });

    function onMouseMove(e) {
      const delta = startY - e.clientY;
      const newHeight = Math.max(80, Math.min(window.innerHeight * 0.6, startHeight + delta));
      terminalPanel.style.height = newHeight + 'px';
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
  }

  // Drag and drop files
  function initDragDrop() {
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      for (const file of e.dataTransfer.files) {
        const result = await window.inkAPI.readFile(file.path);
        if (result.success) {
          openFileInTab(file.path, result.content);
        }
      }
    });
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
  $('#openFile').addEventListener('click', () => window.inkAPI.openFile());
  $('#openFolder').addEventListener('click', () => window.inkAPI.openFolder());
  $('#saveFile').addEventListener('click', () => saveCurrentFile());
  $('#compileJava').addEventListener('click', () => compileAndRunJava());
  $('#toggleTerminal').addEventListener('click', toggleTerminal);
  $('#toggleTheme').addEventListener('click', toggleTheme);
  $('#toggleFind').addEventListener('click', toggleFindBar);
  $('#clearTerminal').addEventListener('click', clearTerminal);
  $('#closeTerminal').addEventListener('click', () => terminalPanel.classList.add('hidden'));
  $('#closeSidebar').addEventListener('click', () => sidebar.classList.add('hidden'));

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

  // IPC listeners from main process menu
  if (window.inkAPI) {
    window.inkAPI.onMenuNewFile(() => createTab());
    window.inkAPI.onMenuSave(() => saveCurrentFile());
    window.inkAPI.onMenuSaveAs(() => saveCurrentFileAs());
    window.inkAPI.onMenuFind(() => toggleFindBar());
    window.inkAPI.onMenuToggleTheme(() => toggleTheme());
    window.inkAPI.onMenuToggleTerminal(() => toggleTerminal());
    window.inkAPI.onMenuCompileJava(() => compileJava());
    window.inkAPI.onMenuRunJava(() => runJava());
    window.inkAPI.onMenuCompileRunJava(() => compileAndRunJava());

    window.inkAPI.onFileOpened((data) => {
      openFileInTab(data.filePath, data.content);
    });

    window.inkAPI.onFolderOpened((data) => {
      sidebar.classList.remove('hidden');
      const dirName = data.dirPath.split(/[/\\]/).pop();
      sidebarTitle.textContent = dirName;
      fileTree.innerHTML = '';
      renderFileTree(data.entries, fileTree);
    });

    window.inkAPI.onJavaStdout((data) => {
      const span = document.createElement('span');
      span.textContent = data;
      terminalOutput.appendChild(span);
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    });

    window.inkAPI.onJavaStderr((data) => {
      const span = document.createElement('span');
      span.className = 'out-error';
      span.textContent = data;
      terminalOutput.appendChild(span);
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    });
  }

  // Init
  loadTheme();
  loadState();
  initTerminalResize();
  initDragDrop();
  editor.focus();

  if (window.inkAPI) {
    checkJava();
  }
})();
