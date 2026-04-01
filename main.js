const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    title: 'Ink Editor',
    backgroundColor: '#1e1e2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');

  const menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);
}

function createMenuTemplate() {
  return [
    {
      label: 'File',
      submenu: [
        { label: 'New File', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu-new-file') },
        { label: 'Open File...', accelerator: 'CmdOrCtrl+O', click: () => handleOpenFile() },
        { label: 'Open Folder...', accelerator: 'CmdOrCtrl+Shift+O', click: () => handleOpenFolder() },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send('menu-save') },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow.webContents.send('menu-save-as') },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Find & Replace', accelerator: 'CmdOrCtrl+H', click: () => mainWindow.webContents.send('menu-find') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Theme', click: () => mainWindow.webContents.send('menu-toggle-theme') },
        { label: 'Toggle Terminal', accelerator: 'CmdOrCtrl+`', click: () => mainWindow.webContents.send('menu-toggle-terminal') },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Run',
      submenu: [
        { label: 'Compile Java', accelerator: 'CmdOrCtrl+B', click: () => mainWindow.webContents.send('menu-compile-java') },
        { label: 'Run Java', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.webContents.send('menu-run-java') },
        { label: 'Compile & Run Java', accelerator: 'F5', click: () => mainWindow.webContents.send('menu-compile-run-java') },
      ],
    },
  ];
}

// File operations
async function handleOpenFile() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Text Files', extensions: ['txt', 'log', 'md', 'csv', 'ini', 'cfg', 'conf', 'env', 'gitignore', 'editorconfig'] },
      { name: 'Web', extensions: ['html', 'htm', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'xml', 'svg', 'yaml', 'yml'] },
      { name: 'Programming', extensions: ['java', 'py', 'c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt', 'scala', 'sh', 'bat', 'ps1'] },
      { name: 'Data', extensions: ['sql', 'toml', 'properties', 'gradle', 'makefile', 'dockerfile'] },
    ],
  });

  if (result.canceled) return;

  for (const filePath of result.filePaths) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      mainWindow.webContents.send('file-opened', { filePath, content });
    } catch (err) {
      dialog.showErrorBox('Error', `Could not read file: ${err.message}`);
    }
  }
}

async function handleOpenFolder() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });

  if (result.canceled) return;

  const dirPath = result.filePaths[0];
  try {
    const entries = readDirectoryRecursive(dirPath, 3);
    mainWindow.webContents.send('folder-opened', { dirPath, entries });
  } catch (err) {
    dialog.showErrorBox('Error', `Could not read folder: ${err.message}`);
  }
}

function readDirectoryRecursive(dirPath, maxDepth, currentDepth = 0) {
  if (currentDepth >= maxDepth) return [];

  const entries = [];
  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    if (item.name.startsWith('.') || item.name === 'node_modules') continue;

    const fullPath = path.join(dirPath, item.name);
    if (item.isDirectory()) {
      entries.push({
        name: item.name,
        path: fullPath,
        type: 'directory',
        children: readDirectoryRecursive(fullPath, maxDepth, currentDepth + 1),
      });
    } else {
      entries.push({
        name: item.name,
        path: fullPath,
        type: 'file',
      });
    }
  }

  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return entries;
}

// IPC Handlers
ipcMain.handle('open-file-dialog', async () => {
  await handleOpenFile();
});

ipcMain.handle('open-folder-dialog', async () => {
  await handleOpenFolder();
});

ipcMain.handle('save-file', async (event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('save-file-as', async (event, { content, defaultName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Text Files', extensions: ['txt', 'log', 'md', 'csv', 'ini', 'cfg'] },
      { name: 'Web', extensions: ['html', 'css', 'js', 'ts', 'json', 'xml', 'yaml'] },
      { name: 'Programming', extensions: ['java', 'py', 'c', 'cpp', 'cs', 'go', 'rs', 'sh'] },
    ],
  });

  if (result.canceled) return { success: false, canceled: true };

  try {
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return { success: true, filePath: result.filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Java compilation
ipcMain.handle('compile-java', async (event, filePath) => {
  return new Promise((resolve) => {
    const dir = path.dirname(filePath);
    const proc = spawn('javac', [filePath], { cwd: dir });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      resolve({ success: code === 0, stdout, stderr, exitCode: code });
    });

    proc.on('error', (err) => {
      resolve({ success: false, stdout: '', stderr: `Failed to run javac: ${err.message}\nMake sure Java JDK is installed and javac is in your PATH.`, exitCode: -1 });
    });
  });
});

ipcMain.handle('run-java', async (event, { filePath, input }) => {
  return new Promise((resolve) => {
    const dir = path.dirname(filePath);
    const className = path.basename(filePath, '.java');
    const proc = spawn('java', [className], { cwd: dir });

    let stdout = '';
    let stderr = '';

    if (input) {
      proc.stdin.write(input);
      proc.stdin.end();
    }

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      mainWindow.webContents.send('java-stdout', data.toString());
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      mainWindow.webContents.send('java-stderr', data.toString());
    });

    proc.on('close', (code) => {
      resolve({ success: code === 0, stdout, stderr, exitCode: code });
    });

    proc.on('error', (err) => {
      resolve({ success: false, stdout: '', stderr: `Failed to run java: ${err.message}\nMake sure Java JRE/JDK is installed and java is in your PATH.`, exitCode: -1 });
    });
  });
});

ipcMain.handle('check-java', async () => {
  return new Promise((resolve) => {
    const proc = spawn('javac', ['-version']);
    let output = '';
    proc.stdout.on('data', (d) => { output += d.toString(); });
    proc.stderr.on('data', (d) => { output += d.toString(); });
    proc.on('close', () => resolve({ installed: true, version: output.trim() }));
    proc.on('error', () => resolve({ installed: false, version: null }));
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
