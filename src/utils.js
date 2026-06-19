const RISK = {
  green: {
    color: "#22c55e", bg: "rgba(5,46,22,0.6)", border: "#166534",
    glow: "rgba(34,197,94,0.15)", label: "Safe", emoji: "🟢",
    gradient: "linear-gradient(135deg, #052e16 0%, #0a3d1f 100%)",
  },
  yellow: {
    color: "#eab308", bg: "rgba(28,23,8,0.6)", border: "#713f12",
    glow: "rgba(234,179,8,0.15)", label: "Heads Up", emoji: "🟡",
    gradient: "linear-gradient(135deg, #1c1708 0%, #2d2310 100%)",
  },
  red: {
    color: "#ef4444", bg: "rgba(28,6,6,0.6)", border: "#7f1d1d",
    glow: "rgba(239,68,68,0.15)", label: "High Risk", emoji: "🔴",
    gradient: "linear-gradient(135deg, #1c0606 0%, #2d0a0a 100%)",
  },
};

const TYPE_LABEL = {
  agent_command:      "Agent Command",
  error:              "Error / Stack Trace",
  log:                "Log Output",
  shell_command:      "Shell Command",
  prompt_instruction: "Prompt Instruction",
  other:              "Selected Text",
};

const TYPE_ICON = {
  agent_command:      "🤖",
  error:              "💥",
  log:                "📄",
  shell_command:      "⚡",
  prompt_instruction: "📝",
  other:              "📋",
};

const DANGEROUS_PATTERNS = [
  { pattern: /rm\s+(-[rRf]+\s+|--recursive|--force)/i,         risk: "red",    label: "File deletion" },
  { pattern: /rmdir\s+\/s/i,                                    risk: "red",    label: "Directory deletion" },
  { pattern: /del\s+\/[sfq]/i,                                  risk: "red",    label: "File deletion" },
  { pattern: /format\s+[a-z]:/i,                                risk: "red",    label: "Disk format" },
  { pattern: /git\s+push\s+.*--force/i,                         risk: "red",    label: "Force push" },
  { pattern: /git\s+reset\s+--hard/i,                           risk: "red",    label: "Hard reset" },
  { pattern: /git\s+clean\s+-[fdx]/i,                           risk: "red",    label: "Clean untracked files" },
  { pattern: /drop\s+(table|database)/i,                        risk: "red",    label: "Database drop" },
  { pattern: /truncate\s+table/i,                               risk: "red",    label: "Table truncation" },
  { pattern: /chmod\s+777/i,                                    risk: "red",    label: "Open permissions" },
  { pattern: /:(){ :\|:& };:/,                                  risk: "red",    label: "Fork bomb" },
  { pattern: /curl\s+.*\|\s*(ba)?sh/i,                          risk: "red",    label: "Piped remote script" },
  { pattern: /wget\s+.*\|\s*(ba)?sh/i,                          risk: "red",    label: "Piped remote script" },
  { pattern: /npm\s+(publish|unpublish)/i,                      risk: "yellow", label: "Package publish" },
  { pattern: /npm\s+install\s+-g/i,                             risk: "yellow", label: "Global install" },
  { pattern: /pip\s+install/i,                                  risk: "yellow", label: "Package install" },
  { pattern: /env\s|process\.env|\.env/i,                       risk: "yellow", label: "Environment variables" },
  { pattern: /curl|wget|fetch|http/i,                           risk: "yellow", label: "Network request" },
  { pattern: /sudo\s/i,                                         risk: "yellow", label: "Elevated privileges" },
  { pattern: /docker\s+(rm|rmi|stop|kill|prune)/i,              risk: "yellow", label: "Docker cleanup" },
];

function quickRiskCheck(text) {
  for (const { pattern, risk, label } of DANGEROUS_PATTERNS) {
    if (pattern.test(text)) return { risk, label };
  }
  return null;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function timeAgo() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, "0");
  const m = now.getMinutes().toString().padStart(2, "0");
  const s = now.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

module.exports = {
  RISK,
  TYPE_LABEL,
  TYPE_ICON,
  DANGEROUS_PATTERNS,
  quickRiskCheck,
  escapeHtml,
  timeAgo,
};
