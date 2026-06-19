const vscode = require("vscode");
const { RISK } = require("./utils");

let statusBar = null;

function initStatusBar(context) {
  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.command = "promptLens.showLastResult";
  statusBar.tooltip = "Prompt Lens — click to open last analysis";
  statusBar.text = "$(eye) Lens";
  statusBar.show();
  context.subscriptions.push(statusBar);
}

function updateStatusBar(result) {
  if (!statusBar) return;
  const rc = RISK[result?.risk] || RISK.green;
  const title = result?.title || "Ready";
  statusBar.text = `${rc.emoji} Lens — ${title}`;
  statusBar.tooltip = `Prompt Lens: ${rc.label}\n${result?.oneliner || title}\nClick to open panel`;
  statusBar.backgroundColor = result?.risk === "red"
    ? new vscode.ThemeColor("statusBarItem.errorBackground")
    : result?.risk === "yellow"
    ? new vscode.ThemeColor("statusBarItem.warningBackground")
    : undefined;
}

function flashStatusBar(label, riskLevel) {
  if (!statusBar) return;
  const rc = RISK[riskLevel] || RISK.yellow;
  statusBar.text = `${rc.emoji} Lens — ${label}`;
  statusBar.backgroundColor = riskLevel === "red"
    ? new vscode.ThemeColor("statusBarItem.errorBackground")
    : riskLevel === "yellow"
    ? new vscode.ThemeColor("statusBarItem.warningBackground")
    : undefined;
}

function resetStatusBar() {
  if (!statusBar) return;
  statusBar.text = "$(eye) Lens";
  statusBar.tooltip = "Prompt Lens — copy a command or select text to analyze";
  statusBar.backgroundColor = undefined;
}

function setAnalyzing() {
  if (!statusBar) return;
  statusBar.text = "$(sync~spin) Lens — analyzing…";
  statusBar.backgroundColor = undefined;
}

module.exports = { initStatusBar, updateStatusBar, flashStatusBar, resetStatusBar, setAnalyzing };

