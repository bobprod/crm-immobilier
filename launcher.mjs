/**
 * Immo SaaS Launcher v3.0 — démarre backend NestJS + frontend Next.js
 * Usage : node launcher.mjs
 * Accès : http://localhost:3000 (launcher) → backend :3001, frontend :3002
 *
 * v3.0 — Améliorations :
 *  - Mise à jour dynamique sans rechargement (polling /api/status)
 *  - Logs séparés backend/frontend avec onglets et coloration
 *  - Vérification réelle de la connexion PostgreSQL (TCP)
 *  - Contrôle individuel des services (start/stop par service)
 *  - Affichage uptime des services
 *  - Endpoints : /api/start|stop/backend|frontend, /api/logs/backend|frontend
 */

import { createServer } from "http";
import { spawn, execSync } from "child_process";
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createConnection } from "net";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LAUNCHER_PORT = 3000;
const BACKEND_PORT = 3001;
const FRONTEND_PORT = 3002;
const PID_FILE = join(__dirname, ".launcher.pid");

// ── État des services ──────────────────────────────────────────────────────

let backendProcess = null;
let frontendProcess = null;
let backendReady = false;
let frontendReady = false;
let backendLogs = [];
let frontendLogs = [];
let backendStartTime = null;
let frontendStartTime = null;
let dbStatus = "unknown"; // 'up' | 'down' | 'unknown'
const MAX_LOGS = 300;
let startupMessage = "";

function pushLog(arr, line) {
  const ts = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  arr.push(`[${ts}] ${line}`);
  if (arr.length > MAX_LOGS) arr.shift();
}

function formatUptime(startTime) {
  if (!startTime) return null;
  const sec = Math.floor((Date.now() - startTime) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ${sec % 60}s`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

// ── Détection et nettoyage de session précédente ───────────────────────────

function isPortInUse(port) {
  return new Promise((resolve) => {
    const sock = createConnection({ port, host: "127.0.0.1" });
    sock.once("connect", () => {
      sock.destroy();
      resolve(true);
    });
    sock.once("error", () => resolve(false));
    sock.setTimeout(800, () => {
      sock.destroy();
      resolve(false);
    });
  });
}

function killProcessOnPort(port) {
  try {
    if (process.platform === "win32") {
      // Trouver les PID sur le port
      const result = execSync(
        `netstat -ano | findstr :${port} | findstr LISTENING`,
        { encoding: "utf8", timeout: 5000 },
      ).trim();
      const pids = new Set();
      for (const line of result.split("\n")) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { timeout: 5000 });
          console.log(
            `[Launcher] ✖ Processus ancien (PID ${pid}) sur :${port} arrêté`,
          );
        } catch {}
      }
    } else {
      // Linux / macOS
      try {
        const result = execSync(`lsof -ti:${port}`, {
          encoding: "utf8",
          timeout: 5000,
        }).trim();
        if (result) {
          for (const pid of result.split("\n")) {
            try {
              execSync(`kill -9 ${pid.trim()}`);
              console.log(
                `[Launcher] ✖ Processus ancien (PID ${pid.trim()}) sur :${port} arrêté`,
              );
            } catch {}
          }
        }
      } catch {}
    }
  } catch {
    // Pas de processus sur ce port, c'est OK
  }
}

function cleanupOldPidFile() {
  if (!existsSync(PID_FILE)) return;
  try {
    const data = JSON.parse(readFileSync(PID_FILE, "utf8"));
    console.log(
      "[Launcher] Session précédente détectée (PID launcher: " +
        data.launcher +
        ")",
    );

    // Tuer l'ancien launcher si encore vivant
    if (data.launcher) {
      try {
        if (process.platform === "win32") {
          execSync(`taskkill /F /PID ${data.launcher}`, { timeout: 5000 });
        } else {
          execSync(`kill -9 ${data.launcher}`);
        }
        console.log("[Launcher] ✖ Ancien launcher arrêté");
      } catch {} // déjà mort
    }
  } catch {}
}

async function cleanupOldSessions() {
  console.log("[Launcher] 🔍 Recherche de sessions précédentes...");

  // 1. Vérifier le fichier PID
  cleanupOldPidFile();

  // 2. Vérifier chaque port
  const ports = [LAUNCHER_PORT, BACKEND_PORT, FRONTEND_PORT];
  const portNames = ["Launcher", "Backend", "Frontend"];
  let foundOld = false;

  for (let i = 0; i < ports.length; i++) {
    const inUse = await isPortInUse(ports[i]);
    if (inUse) {
      console.log(
        `[Launcher] ⚠️  Port :${ports[i]} (${portNames[i]}) déjà occupé — arrêt du processus...`,
      );
      killProcessOnPort(ports[i]);
      foundOld = true;
    }
  }

  if (foundOld) {
    // Attendre que les ports soient libérés
    console.log("[Launcher] ⏳ Attente de la libération des ports...");
    await new Promise((r) => setTimeout(r, 2000));

    // Vérifier à nouveau
    for (let i = 0; i < ports.length; i++) {
      const stillInUse = await isPortInUse(ports[i]);
      if (stillInUse) {
        console.log(
          `[Launcher] ⚠️  Port :${ports[i]} toujours occupé, tentative supplémentaire...`,
        );
        killProcessOnPort(ports[i]);
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    startupMessage =
      "♻️ Session précédente détectée et arrêtée — redémarrage propre";
    console.log("[Launcher] ✅ " + startupMessage);
  } else {
    startupMessage = "🟢 Aucune session précédente — démarrage normal";
    console.log("[Launcher] " + startupMessage);
  }
}

function writePidFile() {
  const data = {
    launcher: process.pid,
    started: new Date().toISOString(),
  };
  writeFileSync(PID_FILE, JSON.stringify(data, null, 2));
}

function removePidFile() {
  try {
    unlinkSync(PID_FILE);
  } catch {}
}

// ── Charge .env ────────────────────────────────────────────────────────────

function loadEnv() {
  try {
    const raw = readFileSync(join(__dirname, "backend", ".env"), "utf8");
    const out = {};
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const idx = t.indexOf("=");
      if (idx < 0) continue;
      out[t.slice(0, idx).trim()] = t
        .slice(idx + 1)
        .trim()
        .replace(/^"|"$/g, "");
    }
    return out;
  } catch {
    return {};
  }
}

// ── Vérification dépendances ───────────────────────────────────────────────

function checkDeps() {
  const issues = [];
  if (!existsSync(join(__dirname, "backend", "node_modules")))
    issues.push("backend/node_modules manquant → cd backend && npm install");
  if (!existsSync(join(__dirname, "frontend", "node_modules")))
    issues.push("frontend/node_modules manquant → cd frontend && npm install");
  if (!existsSync(join(__dirname, "backend", ".env")))
    issues.push("backend/.env manquant");
  return issues;
}

// ── Lancement backend ──────────────────────────────────────────────────────

function startBackend() {
  const cwd = join(__dirname, "backend");
  const distMain = join(__dirname, "backend", "dist", "main.js");
  const hasDist = existsSync(distMain);

  if (hasDist) {
    console.log(
      "[Launcher] ⚡ dist/ trouvé — démarrage rapide (node dist/main)...",
    );
  } else {
    console.log(
      "[Launcher] ⚠️  dist/ absent — démarrage lent en mode dev (peut prendre 30-60s)...",
    );
  }

  const spawnArgs = hasDist
    ? ["npm", ["run", "start:prod"]]
    : ["npm", ["run", "start:dev"]];

  console.log("[Launcher] Démarrage backend NestJS sur :3001...");
  backendProcess = spawn(spawnArgs[0], spawnArgs[1], {
    cwd,
    shell: true,
    env: { ...process.env, PORT: String(BACKEND_PORT) },
  });
  backendStartTime = Date.now();

  function checkBackendReady(line) {
    if (
      line.includes("application is running") ||
      line.includes("Nest application successfully started") ||
      line.includes("Application démarrée") ||
      line.includes("listening on")
    ) {
      backendReady = true;
      console.log(
        "[Launcher] ✅ Backend prêt sur http://localhost:" + BACKEND_PORT,
      );
    }
  }

  backendProcess.stdout.on("data", (d) => {
    const line = d.toString().trim();
    if (line) {
      pushLog(backendLogs, line);
      checkBackendReady(line);
    }
  });

  backendProcess.stderr.on("data", (d) => {
    const line = d.toString().trim();
    if (line) {
      pushLog(backendLogs, line);
      checkBackendReady(line);
    }
  });

  backendProcess.on("exit", (code) => {
    console.log(`[Launcher] Backend arrêté (code ${code})`);
    backendReady = false;
    backendProcess = null;
    backendStartTime = null;
  });
}

// ── Lancement frontend ─────────────────────────────────────────────────────

function startFrontend() {
  const cwd = join(__dirname, "frontend");
  console.log("[Launcher] Démarrage frontend Next.js sur :3002...");
  frontendProcess = spawn("npm", ["run", "dev"], {
    cwd,
    shell: true,
    env: { ...process.env, PORT: String(FRONTEND_PORT) },
  });
  frontendStartTime = Date.now();

  function checkFrontendReady(line) {
    if (
      line.includes("Ready") ||
      line.includes("started server") ||
      line.includes("localhost:" + FRONTEND_PORT)
    ) {
      frontendReady = true;
      console.log(
        "[Launcher] ✅ Frontend prêt sur http://localhost:" + FRONTEND_PORT,
      );
    }
  }

  frontendProcess.stdout.on("data", (d) => {
    const line = d.toString().trim();
    if (line) {
      pushLog(frontendLogs, line);
      checkFrontendReady(line);
    }
  });

  frontendProcess.stderr.on("data", (d) => {
    const line = d.toString().trim();
    if (line) {
      pushLog(frontendLogs, line);
      checkFrontendReady(line);
    }
  });

  frontendProcess.on("exit", (code) => {
    console.log(`[Launcher] Frontend arrêté (code ${code})`);
    frontendReady = false;
    frontendProcess = null;
    frontendStartTime = null;
  });
}

// ── Fallback : détection par port si les logs ne suffisent pas ─────────────

function startReadinessPoller() {
  const interval = setInterval(async () => {
    if (backendReady && frontendReady) {
      clearInterval(interval);
      return;
    }
    if (!backendReady && backendProcess) {
      const up = await isPortInUse(BACKEND_PORT);
      if (up) {
        backendReady = true;
        console.log("[Launcher] ✅ Backend détecté en ligne (via port check)");
      }
    }
    if (!frontendReady && frontendProcess) {
      const up = await isPortInUse(FRONTEND_PORT);
      if (up) {
        frontendReady = true;
        console.log("[Launcher] ✅ Frontend détecté en ligne (via port check)");
      }
    }
  }, 5000);
}

// ── Vérification DB PostgreSQL ─────────────────────────────────────────────

async function checkDbStatus() {
  const env = loadEnv();
  const dbUrl = env.DATABASE_URL || "";
  try {
    let host = "localhost";
    let port = 5432;
    const match = dbUrl.match(/@([^:@\/]+)(?::(\d+))?(?:\/|$)/);
    if (match) {
      host = match[1];
      if (match[2]) port = parseInt(match[2]);
    }
    const up = await new Promise((resolve) => {
      const sock = createConnection({ port, host });
      sock.once("connect", () => {
        sock.destroy();
        resolve(true);
      });
      sock.once("error", () => resolve(false));
      sock.setTimeout(1500, () => {
        sock.destroy();
        resolve(false);
      });
    });
    dbStatus = up ? "up" : "down";
  } catch {
    dbStatus = "down";
  }
}

function startDbPoller() {
  checkDbStatus();
  setInterval(checkDbStatus, 30000);
}

// ── Page HTML du launcher ──────────────────────────────────────────────────

function getHTML() {
  const env = loadEnv();
  const dbUrl = env.DATABASE_URL || "non configuré";
  const dbName = dbUrl.split("/").pop()?.split("?")[0] || "?";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Immo SaaS — Launcher</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%);color:#e2e8f0;min-height:100vh;display:flex;flex-direction:column;align-items:center}
    .header{text-align:center;padding:36px 20px 16px}
    .logo{width:76px;height:76px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;box-shadow:0 8px 32px rgba(59,130,246,.3);font-size:34px}
    .header h1{font-size:26px;font-weight:700;color:#fff}
    .header p{color:#94a3b8;margin-top:4px;font-size:13px}
    .startup-msg{margin-top:8px;padding:6px 16px;background:rgba(59,130,246,.15);border-radius:8px;font-size:13px;color:#93c5fd;display:inline-block}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;max-width:960px;width:100%;padding:0 20px;margin-top:20px}
    .card{background:rgba(30,41,59,.8);border:1px solid rgba(148,163,184,.1);border-radius:16px;padding:22px;backdrop-filter:blur(10px)}
    .card h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:14px}
    .status-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(148,163,184,.08)}
    .status-row:last-of-type{border-bottom:none}
    .status-row .label{font-size:13px;color:#cbd5e1}
    .badge{font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;white-space:nowrap}
    .badge.ok{background:rgba(34,197,94,.15);color:#4ade80}
    .badge.starting{background:rgba(250,204,21,.15);color:#facc15;animation:pulse 1.5s infinite}
    .badge.off{background:rgba(239,68,68,.15);color:#f87171}
    .badge.db-up{background:rgba(34,197,94,.15);color:#4ade80}
    .badge.db-down{background:rgba(239,68,68,.15);color:#f87171}
    .badge.db-unknown{background:rgba(148,163,184,.15);color:#94a3b8}
    .uptime{font-size:11px;color:#64748b;margin-left:6px}
    .btn-group{display:flex;flex-direction:column;gap:6px;margin-top:12px}
    .btn{display:block;width:100%;padding:9px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;border:1px solid transparent;text-align:center}
    .btn:disabled{opacity:.45;cursor:not-allowed}
    .btn-blue{border-color:rgba(59,130,246,.3);background:rgba(59,130,246,.1);color:#93c5fd}
    .btn-blue:hover:not(:disabled){background:rgba(59,130,246,.25);color:#bfdbfe}
    .btn-purple{border-color:rgba(168,85,247,.3);background:rgba(168,85,247,.1);color:#c4b5fd}
    .btn-purple:hover:not(:disabled){background:rgba(168,85,247,.25);color:#ddd6fe}
    .btn-green{border-color:rgba(34,197,94,.3);background:rgba(34,197,94,.1);color:#4ade80}
    .btn-green:hover:not(:disabled){background:rgba(34,197,94,.25);color:#86efac}
    .btn-red{border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.1);color:#f87171}
    .btn-red:hover:not(:disabled){background:rgba(239,68,68,.25);color:#fca5a5}
    .btn-row{display:flex;gap:6px}
    .btn-row .btn{flex:1}
    .links{display:flex;flex-direction:column;gap:8px;margin-top:6px}
    .links a{display:flex;align-items:center;gap:10px;padding:11px 14px;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);border-radius:10px;color:#93c5fd;text-decoration:none;font-size:13px;font-weight:500;transition:all .2s}
    .links a:hover{background:rgba(59,130,246,.2);color:#bfdbfe}
    .links a .arrow{margin-left:auto;opacity:.5}
    .logs-card{grid-column:1/-1}
    .tabs{display:flex;gap:4px;margin-bottom:10px}
    .tab{padding:6px 14px;border-radius:8px 8px 0 0;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(148,163,184,.1);background:rgba(15,23,42,.5);color:#64748b;transition:all .2s}
    .tab.active{background:rgba(30,41,59,.9);color:#e2e8f0;border-bottom-color:rgba(30,41,59,.9)}
    .logs-box{background:#0a1628;border-radius:0 8px 8px 8px;padding:12px;height:220px;overflow-y:auto;font-family:'Cascadia Code','Fira Code',monospace;font-size:11px;line-height:1.7;scroll-behavior:smooth}
    .log-line{display:block;white-space:pre-wrap;word-break:break-all}
    .log-error{color:#f87171}
    .log-warn{color:#facc15}
    .log-success{color:#4ade80}
    .log-info{color:#38bdf8}
    .log-nest{color:#c084fc}
    .log-default{color:#64748b}
    .log-ts{color:#475569;margin-right:4px}
    .info-row{font-size:11px;color:#64748b;padding:5px 0}
    .info-row span{color:#94a3b8}
    .footer{padding:28px 20px;text-align:center;color:#475569;font-size:11px}
    .dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px}
    .dot-green{background:#4ade80}
    .dot-yellow{background:#facc15}
    .dot-red{background:#f87171}
    .dot-gray{background:#64748b}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    .refresh-hint{font-size:11px;color:#334155;margin-top:4px}
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🏠</div>
    <h1>Immo SaaS</h1>
    <p>CRM Immobilier — Launcher v3.0</p>
    <div id="startup-msg" class="startup-msg" style="${startupMessage ? "" : "display:none"}">${startupMessage}</div>
  </div>

  <div class="grid">
    <!-- Services -->
    <div class="card">
      <h2>⚡ Services</h2>
      <div class="status-row">
        <span class="label">Backend NestJS (:${BACKEND_PORT})</span>
        <span id="badge-backend" class="badge ${backendReady ? "ok" : backendProcess ? "starting" : "off"}">
          ${backendReady ? "● En ligne" : backendProcess ? "⟳ Démarrage..." : "○ Arrêté"}
        </span>
      </div>
      <div class="info-row" id="uptime-backend" style="padding-left:2px">${backendReady && backendProcess ? "uptime: <span>calcul...</span>" : ""}</div>
      <div class="status-row">
        <span class="label">Frontend Next.js (:${FRONTEND_PORT})</span>
        <span id="badge-frontend" class="badge ${frontendReady ? "ok" : frontendProcess ? "starting" : "off"}">
          ${frontendReady ? "● En ligne" : frontendProcess ? "⟳ Démarrage..." : "○ Arrêté"}
        </span>
      </div>
      <div class="info-row" id="uptime-frontend" style="padding-left:2px">${frontendReady && frontendProcess ? "uptime: <span>calcul...</span>" : ""}</div>
      <div class="status-row">
        <span class="label">PostgreSQL (:5432)</span>
        <span id="badge-db" class="badge db-${dbStatus === "up" ? "up" : dbStatus === "down" ? "down" : "unknown"}">
          ${dbStatus === "up" ? "● Connecté" : dbStatus === "down" ? "○ Hors ligne" : "? Vérification..."}
        </span>
      </div>
      <div class="info-row">DB : <span>${dbName}</span></div>

      <div class="btn-group" style="margin-top:14px">
        <button class="btn btn-blue" onclick="doAction('restart',this)">🔄 Redémarrer tous les services</button>
        <div class="btn-row">
          <button id="btn-backend" class="btn ${backendProcess ? "btn-red" : "btn-green"}"
            onclick="doAction(this.dataset.action,this)" data-action="${backendProcess ? "stop-backend" : "start-backend"}">
            ${backendProcess ? "⏹ Stop Backend" : "▶ Start Backend"}
          </button>
          <button id="btn-frontend" class="btn ${frontendProcess ? "btn-red" : "btn-green"}"
            onclick="doAction(this.dataset.action,this)" data-action="${frontendProcess ? "stop-frontend" : "start-frontend"}">
            ${frontendProcess ? "⏹ Stop Frontend" : "▶ Start Frontend"}
          </button>
        </div>
        <button class="btn btn-purple" onclick="doAction('rebuild',this)">🔨 Rebuild backend (code modifié)</button>
      </div>
      <p class="refresh-hint" id="refresh-hint">Mise à jour auto toutes les 2s</p>
    </div>

    <!-- Accès rapide -->
    <div class="card">
      <h2>🔗 Accès rapide</h2>
      <div class="links">
        <a href="http://localhost:${FRONTEND_PORT}" target="_blank">📱 Application SaaS<span class="arrow">→</span></a>
        <a href="http://localhost:${BACKEND_PORT}/api" target="_blank">⚙️ API Backend<span class="arrow">→</span></a>
        <a href="http://localhost:${FRONTEND_PORT}/login" target="_blank">🔐 Page de login<span class="arrow">→</span></a>
        <a href="http://localhost:${FRONTEND_PORT}/dashboard" target="_blank">📊 Dashboard<span class="arrow">→</span></a>
        <a href="http://localhost:${FRONTEND_PORT}/sites/demo" target="_blank">🌐 Vitrine publique (demo)<span class="arrow">→</span></a>
      </div>
    </div>

    <!-- Logs -->
    <div class="card logs-card">
      <h2>📋 Logs en direct</h2>
      <div class="tabs">
        <div class="tab active" onclick="switchTab('backend',this)">Backend</div>
        <div class="tab" onclick="switchTab('frontend',this)">Frontend</div>
      </div>
      <div class="logs-box" id="logs-box">
        <em style="color:#475569">En attente de logs...</em>
      </div>
    </div>
  </div>

  <div class="footer">
    Immo SaaS © ${new Date().getFullYear()} — Launcher v3.0 actif sur http://localhost:${LAUNCHER_PORT}
  </div>

  <script>
    let currentTab = 'backend';
    let autoScroll = true;
    let pollTimer = null;

    const logsBox = document.getElementById('logs-box');
    logsBox.addEventListener('mouseenter', () => { autoScroll = false; });
    logsBox.addEventListener('mouseleave', () => { autoScroll = true; scrollLogs(); });

    function scrollLogs() {
      if (autoScroll) logsBox.scrollTop = logsBox.scrollHeight;
    }

    function colorLine(line) {
      const ts = line.match(/^\\[\\d{2}:\\d{2}:\\d{2}\\]/);
      const tsStr = ts ? '<span class="log-ts">' + ts[0] + '</span>' : '';
      const rest = ts ? line.slice(ts[0].length) : line;
      const esc = rest.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      let cls = 'log-default';
      if (/error|exception|failed|uncaught|crash/i.test(esc)) cls = 'log-error';
      else if (/warn(?:ing)?/i.test(esc)) cls = 'log-warn';
      else if (/✅|success|ready|started|listening|prêt|en ligne/i.test(esc)) cls = 'log-success';
      else if (/\\[Nest\\]|NestFactory|NestApplication/i.test(esc)) cls = 'log-nest';
      else if (/info|log|GET |POST |PUT |DELETE /i.test(esc)) cls = 'log-info';
      return '<span class="log-line ' + cls + '">' + tsStr + esc + '</span>';
    }

    function renderLogs(lines) {
      if (!lines || lines.length === 0) {
        logsBox.innerHTML = '<em style="color:#475569">Aucun log disponible...</em>';
        return;
      }
      logsBox.innerHTML = lines.map(colorLine).join('\\n');
      scrollLogs();
    }

    function switchTab(tab, el) {
      currentTab = tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      poll(); // rafraîchir immédiatement
    }

    function updateBadge(id, ready, running) {
      const el = document.getElementById(id);
      if (!el) return;
      el.className = 'badge ' + (ready ? 'ok' : running ? 'starting' : 'off');
      el.textContent = ready ? '● En ligne' : running ? '⟳ Démarrage...' : '○ Arrêté';
    }

    function updateServiceBtn(id, running, service) {
      const btn = document.getElementById(id);
      if (!btn) return;
      if (running) {
        btn.className = 'btn btn-red';
        btn.dataset.action = 'stop-' + service;
        btn.textContent = '⏹ Stop ' + service.charAt(0).toUpperCase() + service.slice(1);
      } else {
        btn.className = 'btn btn-green';
        btn.dataset.action = 'start-' + service;
        btn.textContent = '▶ Start ' + service.charAt(0).toUpperCase() + service.slice(1);
      }
    }

    async function poll() {
      try {
        const r = await fetch('/api/status');
        const d = await r.json();

        updateBadge('badge-backend', d.backend.ready, d.backend.running);
        updateBadge('badge-frontend', d.frontend.ready, d.frontend.running);
        updateServiceBtn('btn-backend', d.backend.running, 'backend');
        updateServiceBtn('btn-frontend', d.frontend.running, 'frontend');

        // Uptime
        const ub = document.getElementById('uptime-backend');
        const uf = document.getElementById('uptime-frontend');
        if (ub) ub.innerHTML = d.backend.uptime ? 'uptime: <span>' + d.backend.uptime + '</span>' : '';
        if (uf) uf.innerHTML = d.frontend.uptime ? 'uptime: <span>' + d.frontend.uptime + '</span>' : '';

        // DB badge
        const dbEl = document.getElementById('badge-db');
        if (dbEl) {
          const s = d.db.status;
          dbEl.className = 'badge db-' + (s === 'up' ? 'up' : s === 'down' ? 'down' : 'unknown');
          dbEl.textContent = s === 'up' ? '● Connecté' : s === 'down' ? '○ Hors ligne' : '? Vérification...';
        }

        // Startup message
        const sm = document.getElementById('startup-msg');
        if (sm) {
          if (d.startupMessage) { sm.textContent = d.startupMessage; sm.style.display = ''; }
          else sm.style.display = 'none';
        }

        // Logs
        const logs = currentTab === 'backend' ? d.logs.backend : d.logs.frontend;
        renderLogs(logs);
      } catch { /* connexion perdue */ }
    }

    function startPolling() {
      poll();
      pollTimer = setInterval(poll, 2000);
    }

    async function doAction(action, btn) {
      btn.disabled = true;
      const origText = btn.textContent;
      const labels = {
        restart: '⏳ Redémarrage...', rebuild: '⏳ Rebuild (1-2 min)...',
        'stop-backend': '⏳ Arrêt...', 'stop-frontend': '⏳ Arrêt...',
        'start-backend': '⏳ Démarrage...', 'start-frontend': '⏳ Démarrage...'
      };
      btn.textContent = labels[action] || '⏳ En cours...';
      try {
        await fetch('/api/' + action, { method: 'POST' });
        setTimeout(() => { btn.disabled = false; btn.textContent = origText; poll(); }, 2000);
      } catch {
        btn.disabled = false;
        btn.textContent = origText;
      }
    }

    startPolling();
  </script>
</body>
</html>`;
}
// ── API JSON status ────────────────────────────────────────────────────────

function getStatus() {
  return JSON.stringify({
    backend: {
      running: !!backendProcess,
      ready: backendReady,
      port: BACKEND_PORT,
      uptime: formatUptime(backendStartTime),
    },
    frontend: {
      running: !!frontendProcess,
      ready: frontendReady,
      port: FRONTEND_PORT,
      uptime: formatUptime(frontendStartTime),
    },
    db: { status: dbStatus },
    startupMessage,
    logs: {
      backend: backendLogs.slice(-30),
      frontend: frontendLogs.slice(-30),
    },
  });
}

// ── Serveur HTTP launcher ──────────────────────────────────────────────────

const server = createServer((req, res) => {
  if (req.url === "/api/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(getStatus());
    return;
  }

  if (req.url === "/api/restart" && req.method === "POST") {
    console.log("[Launcher] 🔄 Redémarrage demandé...");
    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
    }
    if (frontendProcess) {
      frontendProcess.kill();
      frontendProcess = null;
    }
    backendReady = false;
    frontendReady = false;
    backendLogs = [];
    frontendLogs = [];
    startupMessage = "♻️ Redémarrage manuel en cours...";
    setTimeout(async () => {
      // Nettoyer les ports si les process ne sont pas morts proprement
      for (const port of [BACKEND_PORT, FRONTEND_PORT]) {
        const inUse = await isPortInUse(port);
        if (inUse) killProcessOnPort(port);
      }
      await new Promise((r) => setTimeout(r, 1000));
      startBackend();
      startFrontend();
      startReadinessPoller();
      startupMessage =
        "♻️ Redémarré manuellement à " + new Date().toLocaleTimeString("fr-FR");
    }, 1500);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"ok":true,"message":"Redémarrage en cours"}');
    return;
  }

  if (req.url === "/api/rebuild" && req.method === "POST") {
    console.log("[Launcher] 🔨 Rebuild backend demandé...");
    // Arrêter le backend en cours
    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
    }
    backendReady = false;
    backendLogs = [];
    startupMessage = "🔨 Rebuild en cours (1-2 min)...";
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"ok":true,"message":"Rebuild lancé"}');

    // Lancer nest build puis redémarrer
    const buildProc = spawn("npm", ["run", "build"], {
      cwd: join(__dirname, "backend"),
      shell: true,
    });
    buildProc.stdout.on("data", (d) =>
      pushLog(backendLogs, "[BUILD] " + d.toString().trim()),
    );
    buildProc.stderr.on("data", (d) =>
      pushLog(backendLogs, "[BUILD] " + d.toString().trim()),
    );
    buildProc.on("exit", (code) => {
      if (code === 0) {
        startupMessage = "✅ Rebuild terminé — redémarrage rapide...";
        console.log("[Launcher] ✅ Build OK — démarrage prod...");
        startBackend();
        startReadinessPoller();
      } else {
        startupMessage =
          "❌ Rebuild échoué (code " + code + ") — voir les logs";
        console.log("[Launcher] ❌ Build échoué (code " + code + ")");
      }
    });
    return;
  }

  // ── Contrôle individuel des services ────────────────────────────────────

  if (req.url === "/api/stop/backend" && req.method === "POST") {
    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
      backendReady = false;
      backendStartTime = null;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"ok":true}');
    return;
  }

  if (req.url === "/api/stop/frontend" && req.method === "POST") {
    if (frontendProcess) {
      frontendProcess.kill();
      frontendProcess = null;
      frontendReady = false;
      frontendStartTime = null;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"ok":true}');
    return;
  }

  if (req.url === "/api/start/backend" && req.method === "POST") {
    if (!backendProcess) {
      startBackend();
      startReadinessPoller();
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"ok":true}');
    return;
  }

  if (req.url === "/api/start/frontend" && req.method === "POST") {
    if (!frontendProcess) {
      startFrontend();
      startReadinessPoller();
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"ok":true}');
    return;
  }

  // Page principale
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(getHTML());
});

// ── Démarrage ──────────────────────────────────────────────────────────────

async function main() {
  // Nettoyer les sessions anciennes AVANT tout
  await cleanupOldSessions();

  const issues = checkDeps();
  if (issues.length > 0) {
    console.log("\n⚠️  Problèmes détectés :");
    issues.forEach((i) => console.log("   • " + i));
    console.log("\nCorrige-les puis relance le launcher.\n");
  } else {
    startBackend();
    startFrontend();
    startReadinessPoller();
  }

  startDbPoller();

  server.listen(LAUNCHER_PORT, () => {
    writePidFile();
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║        🏠  Immo SaaS — Launcher v3.0                 ║
║                                                       ║
║   Dashboard  : http://localhost:${LAUNCHER_PORT}                  ║
║   Backend    : http://localhost:${BACKEND_PORT}/api               ║
║   Frontend   : http://localhost:${FRONTEND_PORT}                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`);

    // Ouvre le navigateur automatiquement
    const url = `http://localhost:${LAUNCHER_PORT}`;
    try {
      const { platform } = process;
      if (platform === "win32")
        spawn("cmd", ["/c", "start", url], { shell: true });
      else if (platform === "darwin") spawn("open", [url]);
      else spawn("xdg-open", [url]);
    } catch {}
  });
}

main().catch((err) => {
  console.error("[Launcher] Erreur fatale:", err);
  process.exit(1);
});

// ── Arrêt propre ───────────────────────────────────────────────────────────

function shutdown() {
  console.log("\n[Launcher] Arrêt propre...");
  if (backendProcess) backendProcess.kill();
  if (frontendProcess) frontendProcess.kill();
  removePidFile();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", () => {
  removePidFile();
});
