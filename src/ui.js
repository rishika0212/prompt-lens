const vscode = require("vscode");
const { RISK, TYPE_LABEL, TYPE_ICON, escapeHtml, timeAgo } = require("./utils");

let panel = null;
let lastResult = null;

function getWebviewContent(state) {
  const SHARED_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #09090b;
      color: #e5e5e5;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes glow { 0%, 100% { box-shadow: 0 0 8px var(--glow); } 50% { box-shadow: 0 0 20px var(--glow); } }
  `;

  // Loading
  if (state === "loading") {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      ${SHARED_STYLES}
      body { display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 20px; }
      .loader { position: relative; width: 48px; height: 48px; }
      .loader-ring {
        position: absolute; inset: 0;
        border: 3px solid transparent;
        border-radius: 50%;
        border-top-color: #a78bfa;
        animation: spin 1s ease-in-out infinite;
      }
      .loader-ring:nth-child(2) {
        inset: 6px;
        border-top-color: #7c3aed;
        animation-delay: 0.15s;
        animation-direction: reverse;
      }
      .loader-ring:nth-child(3) {
        inset: 12px;
        border-top-color: #5b21b6;
        animation-delay: 0.3s;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .label { color: #52525b; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; }
      .dots { animation: pulse 1.5s ease-in-out infinite; }
    </style></head><body>
    <div class="loader">
      <div class="loader-ring"></div>
      <div class="loader-ring"></div>
      <div class="loader-ring"></div>
    </div>
    <p class="label"><span class="dots">Analyzing with Ollama…</span></p>
    </body></html>`;
  }

  // Empty / Welcome
  if (state === "empty") {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      ${SHARED_STYLES}
      body { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 32px; }
      .welcome { text-align: center; max-width: 300px; animation: fadeIn 0.4s ease-out; }
      .logo {
        width: 64px; height: 64px; margin: 0 auto 20px;
        background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 50%, #c4b5fd 100%);
        border-radius: 16px;
        display: flex; align-items: center; justify-content: center;
        font-size: 30px;
        box-shadow: 0 8px 32px rgba(124,58,237,0.3);
      }
      h2 { font-size: 18px; font-weight: 700; color: #fafafa; margin-bottom: 8px; letter-spacing: -0.02em; }
      .subtitle { color: #71717a; font-size: 13px; line-height: 1.6; margin-bottom: 24px; }
      kbd {
        background: linear-gradient(180deg, #27272a 0%, #18181b 100%);
        border: 1px solid #3f3f46;
        border-radius: 6px;
        padding: 3px 8px;
        font-size: 11px;
        color: #a78bfa;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        box-shadow: 0 2px 0 #09090b;
      }
      .features { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; text-align: left; }
      .feature {
        background: #18181b;
        border: 1px solid #27272a;
        border-radius: 10px;
        padding: 10px 14px;
        display: flex; align-items: center; gap: 10px;
        font-size: 12px; color: #a1a1aa;
        transition: border-color 0.2s, background 0.2s;
      }
      .feature:hover { border-color: #3f3f46; background: #1c1c1f; }
      .feature-icon { font-size: 16px; flex-shrink: 0; }
      .feature strong { color: #d4d4d8; font-weight: 600; }
    </style></head><body>
    <div class="welcome">
      <div class="logo">🔍</div>
      <h2>Prompt Lens</h2>
      <p class="subtitle">Understand every command before you allow it.</p>
      <div class="features">
        <div class="feature"><span class="feature-icon">📋</span><span><strong>Copy</strong> any command → instant risk check</span></div>
        <div class="feature"><span class="feature-icon">✨</span><span><strong>Select</strong> any text → auto-analysis</span></div>
        <div class="feature"><span class="feature-icon">⚡</span><span><strong>Terminal</strong> commands → auto-detected</span></div>
        <div class="feature"><span class="feature-icon">⌨️</span><span><kbd>Ctrl+Shift+L</kbd> → manual deep analysis</span></div>
      </div>
    </div>
    </body></html>`;
  }

  // Error
  if (state?.error) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      ${SHARED_STYLES}
      body { padding: 24px; }
      .error-card {
        background: linear-gradient(135deg, #1c0606 0%, #200a0a 100%);
        border: 1px solid #7f1d1d;
        border-radius: 12px;
        padding: 18px 20px;
        animation: fadeIn 0.3s ease-out;
      }
      .error-head { color: #ef4444; font-size: 14px; font-weight: 600; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
      .error-msg { color: #fca5a5; font-size: 13px; line-height: 1.6; }
      .help-card {
        margin-top: 16px;
        background: linear-gradient(135deg, #0c1929 0%, #111827 100%);
        border: 1px solid #1e3a5f;
        border-radius: 12px;
        padding: 16px 18px;
        animation: fadeIn 0.3s ease-out 0.1s both;
      }
      .help-card h3 { color: #60a5fa; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
      .step { display: flex; gap: 10px; margin-bottom: 8px; color: #93c5fd; font-size: 12.5px; line-height: 1.5; }
      .step-num {
        width: 20px; height: 20px; flex-shrink: 0;
        background: #1e3a5f; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 10px; font-weight: 700; color: #60a5fa;
      }
      code { font-family: 'JetBrains Mono', monospace; background: #0a0f1a; padding: 2px 6px; border-radius: 4px; font-size: 11px; color: #93c5fd; }
    </style></head><body>
    <div class="error-card">
      <div class="error-head">⚠️ Something went wrong</div>
      <div class="error-msg">${escapeHtml(state.error)}</div>
    </div>
    <div class="help-card">
      <h3>Quick Fix</h3>
      <div class="step"><div class="step-num">1</div><span>Run <code>ollama serve</code> in a terminal</span></div>
      <div class="step"><div class="step-num">2</div><span>Pull a model: <code>ollama pull llama3</code></span></div>
      <div class="step"><div class="step-num">3</div><span>Change model in <strong>Settings → Prompt Lens</strong></span></div>
    </div>
    </body></html>`;
  }

  // Result
  const risk = state?.risk || "green";
  const rc = RISK[risk] || RISK.green;
  const typeLabel = TYPE_LABEL[state?.type] || "Selected Text";
  const typeIcon = TYPE_ICON[state?.type] || "📋";
  const timestamp = timeAgo();

  const sourceLabel = state._source === "clipboard" ? "📋 Clipboard"
    : state._source === "terminal" ? "⚡ Terminal"
    : state._source === "selection" ? "✨ Selection"
    : "⌨️ Manual";

  const detailsHtml = (state.details || [])
    .map((d, i) => `<div class="detail" style="animation-delay: ${0.15 + i * 0.08}s">
      <div class="detail-icon">${i === 0 ? "⚙️" : i === 1 ? "💡" : "✅"}</div>
      <div class="detail-body">
        <span class="detail-label">${escapeHtml(d.label)}</span>
        <span class="detail-value">${escapeHtml(d.value)}</span>
      </div>
    </div>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  ${SHARED_STYLES}
  :root { --risk-color: ${rc.color}; --glow: ${rc.glow}; }

  /* ── Risk banner ── */
  .risk-banner {
    background: ${rc.gradient};
    border-bottom: 2px solid ${rc.color};
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: fadeIn 0.3s ease-out;
    position: relative;
    overflow: hidden;
  }
  .risk-banner::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(90deg, transparent 0%, ${rc.glow} 50%, transparent 100%);
    background-size: 200% 100%;
    animation: shimmer 3s ease-in-out infinite;
    pointer-events: none;
  }
  .risk-pill {
    background: ${rc.color};
    color: #000;
    font-size: 10px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 999px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    box-shadow: 0 0 16px ${rc.color}44;
    position: relative;
    z-index: 1;
  }
  .risk-title {
    font-size: 14px;
    font-weight: 600;
    color: #fafafa;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    position: relative;
    z-index: 1;
  }
  .meta-tags {
    display: flex; gap: 6px;
    position: relative; z-index: 1;
  }
  .meta-tag {
    font-size: 10px;
    color: #71717a;
    background: rgba(24,24,27,0.8);
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid #27272a;
    white-space: nowrap;
    backdrop-filter: blur(4px);
  }

  /* ── Hero card ── */
  .hero {
    margin: 16px 16px 0;
    background: ${rc.gradient};
    border: 1px solid ${rc.border};
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    animation: fadeIn 0.3s ease-out 0.05s both;
    box-shadow: 0 4px 24px ${rc.glow};
  }
  .hero-emoji {
    font-size: 28px;
    flex-shrink: 0;
    margin-top: 2px;
    filter: drop-shadow(0 2px 8px ${rc.color}44);
  }
  .hero-content { flex: 1; }
  .hero-text {
    font-size: 15px;
    font-weight: 600;
    color: #fafafa;
    line-height: 1.5;
    letter-spacing: -0.01em;
  }
  .hero-source {
    margin-top: 8px;
    font-size: 10.5px;
    color: #71717a;
    display: flex; align-items: center; gap: 6px;
  }
  .hero-source-badge {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 10px;
  }

  /* ── Command preview ── */
  .preview {
    margin: 12px 16px 0;
    background: #111113;
    border: 1px solid #1c1c1f;
    border-radius: 10px;
    padding: 12px 14px;
    animation: fadeIn 0.3s ease-out 0.1s both;
  }
  .preview-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 8px;
  }
  .preview-label {
    font-size: 9px;
    color: #52525b;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-weight: 600;
  }
  .preview-time { font-size: 10px; color: #3f3f46; font-family: 'JetBrains Mono', monospace; }
  .preview-text {
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
    font-size: 11px;
    color: #8b5cf6;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 72px;
    overflow: hidden;
    position: relative;
    line-height: 1.6;
  }
  .preview-text::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 24px;
    background: linear-gradient(transparent, #111113);
  }

  /* ── Summary ── */
  .summary-section {
    margin: 14px 16px 0;
    animation: fadeIn 0.3s ease-out 0.15s both;
  }
  .summary {
    color: #d4d4d8;
    font-size: 13px;
    line-height: 1.7;
    background: #111113;
    border-left: 3px solid ${rc.color};
    padding: 12px 14px;
    border-radius: 0 10px 10px 0;
  }

  /* ── Breakdown ── */
  .breakdown-section {
    margin: 14px 16px 0;
    animation: fadeIn 0.3s ease-out 0.2s both;
  }
  .expand-btn {
    background: #111113;
    border: 1px solid #27272a;
    border-radius: 8px;
    color: #71717a;
    font-size: 11.5px;
    font-weight: 500;
    padding: 8px 14px;
    cursor: pointer;
    width: 100%;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s;
    font-family: inherit;
  }
  .expand-btn:hover { border-color: #3f3f46; color: #a1a1aa; background: #18181b; }
  .expand-btn .chevron {
    transition: transform 0.25s ease;
    font-size: 10px;
  }
  .expand-btn.open .chevron { transform: rotate(180deg); }

  .details-list {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.35s ease, margin-top 0.35s ease;
    margin-top: 0;
  }
  .details-list.visible {
    max-height: 500px;
    margin-top: 8px;
  }

  .detail {
    display: flex;
    gap: 10px;
    background: #111113;
    border: 1px solid #1c1c1f;
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 6px;
    animation: slideIn 0.25s ease-out both;
    transition: border-color 0.2s;
  }
  .detail:hover { border-color: #27272a; }
  .detail-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
  .detail-body { flex: 1; display: flex; flex-direction: column; gap: 3px; }
  .detail-label {
    font-size: 9.5px;
    color: #52525b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }
  .detail-value {
    color: #d4d4d8;
    font-size: 12.5px;
    line-height: 1.55;
  }

  /* ── Tip ── */
  .tip-card {
    margin: 14px 16px 16px;
    background: linear-gradient(135deg, #0c1929 0%, #0f1b2d 100%);
    border: 1px solid #1e3a5f;
    border-radius: 10px;
    padding: 13px 15px;
    animation: fadeIn 0.3s ease-out 0.25s both;
  }
  .tip-header {
    font-size: 9.5px;
    color: #3b82f6;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 6px;
    display: flex; align-items: center; gap: 6px;
  }
  .tip-text {
    color: #93c5fd;
    font-size: 12.5px;
    line-height: 1.6;
  }
</style>
<script>
  function toggleBreakdown() {
    const btn = document.getElementById('expandBtn');
    const list = document.getElementById('detailsList');
    const isOpen = list.classList.contains('visible');
    list.classList.toggle('visible', !isOpen);
    btn.classList.toggle('open', !isOpen);
    btn.querySelector('.text').textContent = isOpen ? 'Show breakdown' : 'Hide breakdown';
  }
</script>
</head>
<body>

<div class="risk-banner">
  <div class="risk-pill">${rc.emoji} ${rc.label}</div>
  <div class="risk-title">${escapeHtml(state.title || "Analysis")}</div>
  <div class="meta-tags">
    <span class="meta-tag">${typeIcon} ${escapeHtml(typeLabel)}</span>
  </div>
</div>

<div class="hero">
  <div class="hero-emoji">${rc.emoji}</div>
  <div class="hero-content">
    <div class="hero-text">${escapeHtml(state.oneliner || state.summary || "")}</div>
    <div class="hero-source">
      <span class="hero-source-badge">${sourceLabel}</span>
      <span>${timestamp}</span>
    </div>
  </div>
</div>

<div class="preview">
  <div class="preview-header">
    <span class="preview-label">Command / text</span>
    <span class="preview-time">${timestamp}</span>
  </div>
  <div class="preview-text">${escapeHtml(state._selectedText || "")}</div>
</div>

<div class="summary-section">
  <div class="summary">${escapeHtml(state.summary || "")}</div>
</div>

${state.details?.length ? `
<div class="breakdown-section">
  <button class="expand-btn" id="expandBtn" onclick="toggleBreakdown()">
    <span class="text">Show breakdown</span>
    <span class="chevron">▼</span>
  </button>
  <div class="details-list" id="detailsList">
    ${detailsHtml}
  </div>
</div>` : ""}

${state.tip ? `
<div class="tip-card">
  <div class="tip-header">💡 Pro tip</div>
  <div class="tip-text">${escapeHtml(state.tip)}</div>
</div>` : ""}

</body>
</html>`;
}

function showPanel(context, content) {
  if (content !== "loading" && content !== "empty" && !content?.error) {
    lastResult = content;
  }
  if (!panel) {
    panel = vscode.window.createWebviewPanel(
      "promptLens",
      "Prompt Lens",
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: true, retainContextWhenHidden: true }
    );
    panel.onDidDispose(() => { panel = null; }, null, context.subscriptions);
  }
  panel.webview.html = getWebviewContent(content);
  panel.reveal(vscode.ViewColumn.Beside, true);
}

function getLastResult() { return lastResult; }

module.exports = { getWebviewContent, showPanel, getLastResult };
