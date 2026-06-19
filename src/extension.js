// Prompt Lens — VSCode Extension v0.3.0
// ═══════════════════════════════════════════════════════════════════════════════
// Auto-triggers:
//   📋 Clipboard watch — copy a command → instant risk explanation
//   ⚡ Terminal watch  — AI agent runs a command → notification fires
//   ✨ Selection watch — highlight any text → panel auto-updates
//   ⌨️ Manual          — Ctrl+Shift+L → full analysis
// Powered by Ollama (local LLM — nothing leaves your machine)
// ═══════════════════════════════════════════════════════════════════════════════

const vscode = require("vscode");
const { quickRiskCheck } = require("./utils");
const { analyze, promptAndSaveApiKey } = require("./ollama");
const { showPanel, getLastResult } = require("./ui");
const { initStatusBar, updateStatusBar, flashStatusBar, resetStatusBar, setAnalyzing } = require("./status");

// Core helpers moved to modules: utils, ollama, ui, status

// ─── Manual Command ───────────────────────────────────────────────────────────

async function analyzeSelection(context) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const selection = editor.selection;
  const selectedText = editor.document.getText(selection).trim();

  if (!selectedText) {
    vscode.window.showWarningMessage("Prompt Lens: Select some text first.");
    return;
  }

  // Instant pre-check for known dangerous patterns
  const quick = quickRiskCheck(selectedText);
  if (quick) {
    flashStatusBar(quick.label, quick.risk);
  }

  showPanel(context, "loading");
  const result = await analyze(selectedText, context, "manual");
  if (!result.error) updateStatusBar(result);
  showPanel(context, result);
}

// ─── Selection Watch ──────────────────────────────────────────────────────────

let selectionDebounce = null;
let lastSelectionText = "";

function startSelectionWatch(context) {
  const MIN_LEN = 25;

  const disposable = vscode.window.onDidChangeTextEditorSelection(async (event) => {
    const config = vscode.workspace.getConfiguration("promptLens");
    if (!config.get("selectionWatch", true)) return;

    const editor = event.textEditor;
    const selection = editor.selection;
    if (selection.isEmpty) return;

    const text = editor.document.getText(selection).trim();
    if (!text || text.length < MIN_LEN || text === lastSelectionText) return;
    lastSelectionText = text;

    // Clear previous debounce
    if (selectionDebounce) clearTimeout(selectionDebounce);

    // Instant pre-check for dangerous patterns — show in status bar immediately
    const quick = quickRiskCheck(text);
    if (quick) {
      flashStatusBar(quick.label, quick.risk);
    }

    // Debounce 800ms before firing Ollama
    selectionDebounce = setTimeout(async () => {
      setAnalyzing();

      const result = await analyze(text, context, "selection");

      if (result.error) {
        resetStatusBar();
        return;
      }

      updateStatusBar(result);

      // Don't auto-open panel for selection — just update status bar
      // User can click the status bar to see details
    }, 800);
  });

  context.subscriptions.push(disposable);
}

// ─── Clipboard Watch ──────────────────────────────────────────────────────────

let lastClipboard = "";
let clipboardTimer = null;
let clipboardDebounce = null;

function startClipboardWatch(context) {
  const MIN_LEN = 20;
  let analyzing = false;

  clipboardTimer = setInterval(async () => {
    const config = vscode.workspace.getConfiguration("promptLens");
    if (!config.get("clipboardWatch", true)) return;

    let text;
    try {
      text = await vscode.env.clipboard.readText();
    } catch {
      return;
    }

    if (!text || text === lastClipboard || text.length < MIN_LEN) return;
    lastClipboard = text;

    // Instant pre-check
    const quick = quickRiskCheck(text);
    if (quick) {
      flashStatusBar(quick.label, quick.risk);
      // For red-risk clipboard items, show immediate warning
      if (quick.risk === "red") {
        vscode.window.showWarningMessage(
          `🔴 Prompt Lens — ${quick.label} detected in clipboard!`,
          "See Details"
        ).then(action => {
          if (action === "See Details") {
            const last = getLastResult();
            if (last) showPanel(context, last);
          }
        });
      }
    }

    if (clipboardDebounce) clearTimeout(clipboardDebounce);
    clipboardDebounce = setTimeout(async () => {
      if (analyzing) return;
      analyzing = true;

      setAnalyzing();

      const result = await analyze(text, context, "clipboard");

      if (result.error) {
        resetStatusBar();
        analyzing = false;
        return;
      }

      updateStatusBar(result);

      const rc = require("./utils").RISK[result.risk] || require("./utils").RISK.green;
      const msg = `${rc.emoji} ${rc.label} — ${result.oneliner || result.title}`;

      if (result.risk === "red") {
        const action = await vscode.window.showWarningMessage(msg, "See Details");
        if (action === "See Details") showPanel(context, result);
      } else {
        const action = await vscode.window.showInformationMessage(msg, "See Details", "Dismiss");
        if (action === "See Details") showPanel(context, result);
      }

      analyzing = false;
    }, 400);
  }, 300);
}

function stopClipboardWatch() {
  if (clipboardTimer) { clearInterval(clipboardTimer); clipboardTimer = null; }
  if (clipboardDebounce) { clearTimeout(clipboardDebounce); clipboardDebounce = null; }
}

// ─── Terminal Watch ───────────────────────────────────────────────────────────

function startTerminalWatch(context) {
  if (typeof vscode.window.onDidStartTerminalShellExecution !== "function") {
    return; // Graceful degradation on older VS Code
  }

  const MIN_LEN = 20;

  const disposable = vscode.window.onDidStartTerminalShellExecution(async (event) => {
    const config = vscode.workspace.getConfiguration("promptLens");
    if (!config.get("terminalWatch", true)) return;

    const commandLine = event.execution?.commandLine?.value;
    if (!commandLine || commandLine.trim().length < MIN_LEN) return;

    const text = commandLine.trim();

    // Instant pre-check
    const quick = quickRiskCheck(text);
    if (quick) {
      flashStatusBar(quick.label, quick.risk);
    }

    const result = await analyze(text, context, "terminal");
    if (result.error) return;

    updateStatusBar(result);

    const rc = require("./utils").RISK[result.risk] || require("./utils").RISK.green;
    const msg = `${rc.emoji} Terminal — ${result.oneliner || result.title}`;

    if (result.risk === "red") {
      const action = await vscode.window.showWarningMessage(msg, "See Details");
      if (action === "See Details") showPanel(context, result);
    } else if (result.risk === "yellow") {
      const action = await vscode.window.showWarningMessage(msg, "See Details", "Dismiss");
      if (action === "See Details") showPanel(context, result);
    } else {
      const action = await vscode.window.showInformationMessage(msg, "See Details", "Dismiss");
      if (action === "See Details") showPanel(context, result);
    }
  });

  context.subscriptions.push(disposable);
}

// ─── Activate ─────────────────────────────────────────────────────────────────

function activate(context) {
  initStatusBar(context);

  // Manual command
  context.subscriptions.push(
    vscode.commands.registerCommand("promptLens.analyzeSelection", () =>
      analyzeSelection(context)
    )
  );

  // Show last result (status bar click)
  context.subscriptions.push(
    vscode.commands.registerCommand("promptLens.showLastResult", () => {
      const last = getLastResult();
      if (last) {
        showPanel(context, last);
      } else {
        showPanel(context, "empty");
      }
    })
  );

  // API key commands
  context.subscriptions.push(
    vscode.commands.registerCommand("promptLens.setApiKey", async () => {
      await promptAndSaveApiKey(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("promptLens.clearApiKey", async () => {
      await context.secrets.delete("promptLens.apiKey");
      vscode.window.showInformationMessage("Prompt Lens: API key cleared.");
    })
  );

  // Auto-triggers
  startSelectionWatch(context);
  startClipboardWatch(context);
  startTerminalWatch(context);
}

// ─── Deactivate ───────────────────────────────────────────────────────────────

function deactivate() {
  stopClipboardWatch();
}

module.exports = { activate, deactivate };
