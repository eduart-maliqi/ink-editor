# Ink Editor

A lightweight, zero-dependency text editor that runs in your browser.

![Ink Editor](https://img.shields.io/badge/license-MIT-blue) ![No Dependencies](https://img.shields.io/badge/dependencies-0-green)

## Features

- **Multiple tabs** with rename support (double-click tab title)
- **Find & Replace** with match counting
- **Auto-save** to localStorage
- **Dark / Light theme** toggle
- **Line numbers** with active line highlighting
- **Auto-closing brackets** and quotes
- **Smart indentation** with Tab/Shift+Tab support
- **Word and character count**
- **Cursor position** tracking

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+N` | New tab |
| `Ctrl+W` | Close tab |
| `Ctrl+S` | Save |
| `Ctrl+H` | Find & Replace |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Tab` | Indent |
| `Shift+Tab` | Unindent |
| `Escape` | Close find bar |

## Getting Started

No build step required. Just open `index.html` in your browser:

```bash
# Clone the repo
git clone https://github.com/eduart-maliqi/ink-editor.git
cd ink-editor

# Open in browser
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

Or serve it locally:

```bash
npx serve .
```

## Project Structure

```
ink-editor/
├── index.html      # Main HTML
├── css/
│   └── style.css   # Styles with dark/light themes
├── js/
│   └── editor.js   # Editor logic
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
