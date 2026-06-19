const vscode = require("vscode");
const http = require("http");
const https = require("https");
const url = require("url");
const { RISK } = require("./utils");

const SYSTEM_PROMPT = `You are an expert at explaining technical text to developers in plain English.
The user has selected or copied some text inside VSCode — it could be:
- An AI agent command or instruction (from Claude Code, Copilot, Cursor, etc.)
- A terminal shell command (PowerShell, bash, cmd)
- A terminal error or stack trace
- A log output
- A config or prompt instruction

Your job: explain it clearly and assess if it's safe.

Return ONLY valid JSON, no markdown, no preamble:
{
  "type": "agent_command" | "error" | "log" | "shell_command" | "prompt_instruction" | "other",
  "risk": "green" | "yellow" | "red",
  "title": "Short label, max 6 words",
  "oneliner": "One sentence. Plain English. What does this DO? Max 12 words.",
  "summary": "1-2 sentences. Plain English. What does this DO and why? Write as if explaining to someone who just started coding.",
  "details": [
    { "label": "What it does", "value": "..." },
    { "label": "Why it matters", "value": "..." },
    { "label": "Safe to proceed?", "value": "..." }
  ],
  "tip": "One actionable tip. For errors: how to fix. For commands: what to watch out for. Max 2 sentences."
}

Risk levels:
- "green": Safe. Formatting, persona, explanations, info logs, read-only operations, version checks.
- "yellow": Worth knowing. File access, env variables, network calls, memory, external services.
- "red": High risk. Deletes files, runs arbitrary shell, bypasses safety, exposes secrets, irreversible.

For errors/stack traces: risk is always "yellow" minimum — something went wrong.
Be direct. No jargon. No hedging. Write like a senior dev explaining to a junior.`;

function callOllama(selectedText, apiKey) {
  return new Promise((resolve, reject) => {
    const config = vscode.workspace.getConfiguration("promptLens");
    const endpoint = (config.get("ollamaEndpoint") || "http://localhost:11434").replace(/\/$/, "");
    const model = config.get("model") || "llama3";

    const body = JSON.stringify({
      model,
      prompt: `${SYSTEM_PROMPT}\n\nExplain this:\n\n${selectedText}`,
      stream: false,
      format: "json",
    });

    const parsedUrl = url.parse(`${endpoint}/api/generate`);
    const transport = parsedUrl.protocol === "https:" ? https : http;

    const headers = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const req = transport.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
        path: parsedUrl.path,
        method: "POST",
        headers,
        timeout: 30000,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            if (res.statusCode !== 200) {
              return reject(new Error(`Ollama returned HTTP ${res.statusCode}. Is Ollama running? Try: ollama serve`));
            }
            const parsed = JSON.parse(data);
            const rawText = parsed.response || "";
            const clean = rawText.replace(/```json|```/g, "").trim();
            resolve(JSON.parse(clean));
          } catch (e) {
            reject(new Error("Could not parse model response. Try a larger model like llama3 or mistral."));
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Ollama request timed out after 30s. The model might be loading — try again."));
    });

    req.on("error", (err) => {
      if (err.code === "ECONNREFUSED") {
        reject(new Error("Cannot connect to Ollama. Make sure it's running: open a terminal and run `ollama serve`"));
      } else {
        reject(err);
      }
    });

    req.write(body);
    req.end();
  });
}

async function getOptionalApiKey(context) {
  return await context.secrets.get("promptLens.apiKey");
}

async function promptAndSaveApiKey(context) {
  const key = await vscode.window.showInputBox({
    prompt: "Enter your API key for remote Ollama access (leave blank if using Ollama locally)",
    password: true,
    placeHolder: "Optional — only needed for remote or authenticated Ollama endpoints",
    ignoreFocusOut: true,
  });
  if (key !== undefined) {
    if (key.trim()) {
      await context.secrets.store("promptLens.apiKey", key.trim());
      vscode.window.showInformationMessage("Prompt Lens: API key saved.");
    } else {
      await context.secrets.delete("promptLens.apiKey");
      vscode.window.showInformationMessage("Prompt Lens: No key set (using local Ollama).");
    }
  }
}

async function analyze(text, context, source = "manual") {
  try {
    const apiKey = await getOptionalApiKey(context);
    const result = await callOllama(text, apiKey);
    result._selectedText = text.slice(0, 400);
    result._source = source;
    return result;
  } catch (err) {
    return { error: err.message || "Unknown error", _source: source };
  }
}

module.exports = { callOllama, analyze, getOptionalApiKey, promptAndSaveApiKey, SYSTEM_PROMPT };
