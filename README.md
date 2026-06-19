# Prompt Lens

A small VS Code helper that explains selected text or clipboard commands and flags risky patterns.

- Quickly see risk (green / yellow / red) in the status bar
- Click the status item for a short explanation and one actionable tip
- Auto-watches clipboard, selection and terminal activity

Quick start
```
# run a local Ollama instance (recommended)
ollama pull llama3
ollama serve

# open in VS Code and press F5 to run in the Extension Host
code .
```

Usage
- Copy a command → status bar shows risk
- Select text → status bar updates (click to open panel)
- Press Ctrl+Shift+L for a full breakdown

Configuration
- Settings: `promptLens.ollamaEndpoint`, `promptLens.model`, and watches

License: MIT
