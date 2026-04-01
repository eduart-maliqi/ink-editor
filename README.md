# Ink Editor

A lightweight desktop text editor with a built-in Java compiler, powered by Electron.

![Ink Editor](https://img.shields.io/badge/license-MIT-blue) ![Electron](https://img.shields.io/badge/electron-33-blue) ![No Runtime Dependencies](https://img.shields.io/badge/runtime_deps-0-green)

## Features

- **Open & edit files** from your filesystem (Ctrl+O)
- **Open folders** with file explorer sidebar (Ctrl+Shift+O)
- **Drag & drop** files into the editor
- **Multiple tabs** with rename support (double-click tab title)
- **Save / Save As** to disk (Ctrl+S / Ctrl+Shift+S)
- **Built-in Java compiler** - compile and run Java files directly (F5)
- **Integrated terminal** for compiler output (Ctrl+`)
- **Find & Replace** with match counting (Ctrl+H)
- **Dark / Light theme** toggle
- **Line numbers** with active line highlighting
- **Auto-closing brackets** and quotes
- **Smart indentation** with Tab/Shift+Tab
- **Word and character count**
- **Language detection** from file extension

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+N` | New tab |
| `Ctrl+O` | Open file |
| `Ctrl+Shift+O` | Open folder |
| `Ctrl+S` | Save |
| `Ctrl+Shift+S` | Save As |
| `Ctrl+W` | Close tab |
| `Ctrl+H` | Find & Replace |
| `Ctrl+B` | Compile Java |
| `Ctrl+R` | Run Java |
| `F5` | Compile & Run Java |
| `` Ctrl+` `` | Toggle terminal |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Tab` | Indent |
| `Shift+Tab` | Unindent |
| `Escape` | Close find bar |

## Java Compiler

Ink Editor includes a built-in Java compilation and execution environment. Requirements:

- **Java JDK** must be installed and `javac`/`java` must be in your system PATH
- Open or create a `.java` file
- Press **F5** to compile and run, or use the green **Run** button

The integrated terminal displays compilation errors, warnings, and program output.

## Getting Started

```bash
# Clone the repo
git clone https://github.com/eduart-maliqi/ink-editor.git
cd ink-editor

# Install dependencies
npm install

# Run the app
npm start
```

## Building

```bash
# Build for your platform
npm run build

# Platform-specific builds
npm run build:win     # Windows (.exe)
npm run build:mac     # macOS (.dmg)
npm run build:linux   # Linux (.AppImage)
```

## Project Structure

```
ink-editor/
├── main.js         # Electron main process
├── preload.js      # IPC bridge (secure context isolation)
├── index.html      # App UI
├── css/
│   └── style.css   # Styles with dark/light themes
├── js/
│   └── editor.js   # Editor logic, file ops, Java compiler
├── package.json
├── LICENSE
└── README.md
```

## Contributing

Contributions are welcome! Feel free to open issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE)
