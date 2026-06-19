# 🔍 Prompt Lens

**Understand every AI command before you click Allow.**

Vibecoders don't always know what Claude Code, Copilot, or Cursor is about to run. Prompt Lens explains it — in plain English, with color-coded risk levels — so you learn and stay safe.

Powered by **Ollama** — everything runs locally. Nothing leaves your machine.

---

## The Problem

AI agents in VS Code ask you to "Allow" commands like:

```
$ErrorActionPreference='SilentlyContinue'; Get-Command ollama |
Select-Object Name,Source; if (Get-Command ollama) { ollama --version };
try { (Invoke-WebRequest -UseBasicParsing http://localhost:11434/api/tags
-TimeoutSec 5).Content }
```

Most vibecoders just click **Allow** without understanding what this does. That's dangerous.

**Prompt Lens shows you:**

- 🟢 **Safe** — "Checks if Ollama is installed and its local API is responding"
- 🟡 **Heads Up** — "Installs a global npm package that can modify your system"
- 🔴 **High Risk** — "Deletes all untracked files including your .env secrets"

---

## How It Works

### 📋 Copy → Instant Risk Check (before you click Allow)
When an AI agent shows a "Run command?" dialog, **copy** the command. Prompt Lens detects the clipboard change and instantly shows the risk in your status bar.

### ✨ Select → Auto-Analysis
Highlight any text in your editor — the status bar updates with the risk level. Click it to see the full explanation.

### ⚡ Terminal → Auto-Detection
When an AI agent runs a command in your terminal, Prompt Lens automatically fires a notification with what it does.

### ⌨️ Ctrl+Shift+L → Deep Analysis
Select any text and press `Ctrl+Shift+L` for a full breakdown panel with detailed explanation, risk assessment, and tips.

---

## Instant Pattern Detection

Prompt Lens doesn't always need to call Ollama. It recognizes **20+ dangerous patterns** instantly — no delay:

| Pattern | Risk |
|---------|------|
| `rm -rf`, `del /s` | 🔴 File deletion |
| `git push --force` | 🔴 Force push |
| `git reset --hard` | 🔴 Hard reset |
| `curl ... \| sh` | 🔴 Piped remote script |
| `DROP TABLE` | 🔴 Database drop |
| `chmod 777` | 🔴 Open permissions |
| `sudo ...` | 🟡 Elevated privileges |
| `npm install -g` | 🟡 Global install |
| `curl`, `wget` | 🟡 Network request |

These fire immediately in the status bar while Ollama provides the full explanation.

---

## What You Can Analyze

| Text type | Example |
|-----------|---------|
| Agent commands | Copilot asking to run `rm -rf node_modules` |
| Shell commands | `git push --force origin main` |
| Error / stack trace | `TypeError: Cannot read property 'map' of undefined` |
| Log output | Weird lines in your terminal you don't understand |
| Prompt instructions | System prompts, `.cursorrules`, agent configs |
| Anything else | Config snippets, API responses, whatever |

---

## Setup

### 1. Install Ollama

Download from [ollama.com](https://ollama.com) and install. Then:

```bash
ollama pull llama3
ollama serve
```

> **Tip:** `llama3` works great. Also try: `mistral`, `phi3`, `gemma`.

### 2. Load the Extension (dev mode)

```bash
code prompt-lens/
# Press F5 → opens Extension Development Host
```

### 3. You're ready

- **Copy** any command → status bar shows risk
- **Select** text → status bar updates
- **Ctrl+Shift+L** → full analysis panel

---

## Configuration

Open **Settings → Prompt Lens**:

| Setting | Default | Description |
|---------|---------|-------------|
| `promptLens.ollamaEndpoint` | `http://localhost:11434` | Ollama server URL |
| `promptLens.model` | `llama3` | Model for analysis |
| `promptLens.clipboardWatch` | `true` | Auto-analyze clipboard |
| `promptLens.selectionWatch` | `true` | Auto-analyze text selection |
| `promptLens.terminalWatch` | `true` | Auto-detect terminal commands |

---

## Commands

| Command | Shortcut | What it does |
|---------|----------|-------------|
| `Lens: Explain This` | `Ctrl+Shift+L` / `Cmd+Shift+L` | Full analysis of selected text |
| `Lens: Show Last Analysis` | Click status bar | Re-open the last analysis panel |
| `Lens: Set Ollama API Key` | — | For remote/authenticated Ollama |
| `Lens: Clear Stored API Key` | — | Remove stored key |

---

## How It's Different

| Tool | What it does | Prompt Lens |
|------|-------------|-------------|
| **VS Code native** | "Safe" / "Caution" badge | ❌ No explanation of *what* it does |
| **Curb** | Blocks dangerous commands | ❌ Doesn't explain — just walls you |
| **ForceField** | Enterprise risk scores | ❌ Reports, not friendly explanations |
| **Prompt Lens** | **Explains + teaches** | ✅ Learn what commands do, grow as a dev |

---

## Publishing to Marketplace

```bash
npm install -g @vscode/vsce
vsce package        # creates prompt-lens-0.3.0.vsix
vsce publish        # needs publisher account at marketplace.visualstudio.com
```

---

## What's Next

- **Inline decorations** — color highlights on the command line itself
- **History panel** — see all past analyses in one place
- **Multi-model** — switch models from the status bar
- **Browser extension** — Lens button inside Claude.ai and ChatGPT web
