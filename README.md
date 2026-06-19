<!-- prettier-ignore -->
# Prompt Lens 🔍

[![Status](https://img.shields.io/badge/status-ready-brightgreen.svg)](https://github.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A tiny, focused VS Code extension that explains commands and highlights risky patterns so you can decide before you run things.

Why it helps
- **See risk quickly** — status bar shows Green / Yellow / Red at a glance.
- **Understand before you run** — short explanation + one actionable tip.
- **Zero fuss** — auto-watches clipboard, selection and terminals.

Highlights
- ✅ Fast local pattern checks (no network needed for many cases)
- ✅ Full explanations powered by a local Ollama model (configurable)
- ✅ Lightweight UI: status item + compact analysis panel

Quick start
```bash
# (recommended) run Ollama locally
ollama pull llama3
ollama serve

# open the project and run the extension host
code .
# press F5 in VS Code to launch the Extension Development Host
```

Basic usage
- Copy a command → status bar updates
- Select text → status bar updates (click to open details)
- Press **Ctrl+Shift+L** → full breakdown panel

Configuration (Settings → Prompt Lens)
- `promptLens.ollamaEndpoint` — Ollama server URL (default: `http://localhost:11434`)
- `promptLens.model` — model to use (default: `llama3`)
- `promptLens.clipboardWatch` / `selectionWatch` / `terminalWatch`

Examples
- Detects `rm -rf`, `git push --force`, `curl | sh`, `DROP TABLE`, `chmod 777`, and more.

Contributing
- Open an issue or PR. Keep changes small and focused.

License
- MIT
