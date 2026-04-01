const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('inkAPI', {
  // File operations
  openFile: () => ipcRenderer.invoke('open-file-dialog'),
  openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
  saveFile: (filePath, content) => ipcRenderer.invoke('save-file', { filePath, content }),
  saveFileAs: (content, defaultName) => ipcRenderer.invoke('save-file-as', { content, defaultName }),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),

  // Java
  compileJava: (filePath) => ipcRenderer.invoke('compile-java', filePath),
  runJava: (filePath, input) => ipcRenderer.invoke('run-java', { filePath, input }),
  checkJava: () => ipcRenderer.invoke('check-java'),

  // Menu events
  onMenuNewFile: (cb) => ipcRenderer.on('menu-new-file', cb),
  onMenuSave: (cb) => ipcRenderer.on('menu-save', cb),
  onMenuSaveAs: (cb) => ipcRenderer.on('menu-save-as', cb),
  onMenuFind: (cb) => ipcRenderer.on('menu-find', cb),
  onMenuToggleTheme: (cb) => ipcRenderer.on('menu-toggle-theme', cb),
  onMenuToggleTerminal: (cb) => ipcRenderer.on('menu-toggle-terminal', cb),
  onMenuCompileJava: (cb) => ipcRenderer.on('menu-compile-java', cb),
  onMenuRunJava: (cb) => ipcRenderer.on('menu-run-java', cb),
  onMenuCompileRunJava: (cb) => ipcRenderer.on('menu-compile-run-java', cb),

  // File opened from main process
  onFileOpened: (cb) => ipcRenderer.on('file-opened', (e, data) => cb(data)),
  onFolderOpened: (cb) => ipcRenderer.on('folder-opened', (e, data) => cb(data)),

  // Java output streaming
  onJavaStdout: (cb) => ipcRenderer.on('java-stdout', (e, data) => cb(data)),
  onJavaStderr: (cb) => ipcRenderer.on('java-stderr', (e, data) => cb(data)),
});
