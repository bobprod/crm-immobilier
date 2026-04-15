/**
 * Immo SaaS Launcher — démarre backend NestJS + frontend Next.js
 * Usage : node launcher.mjs
 * Accès : http://localhost:3000 (launcher) → backend :3001, frontend :3002
 *
 * Vérifie les dépendances, lance les deux serveurs,
 * et affiche une page de statut / dashboard.
 * Détecte et arrête automatiquement les sessions précédentes.
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
const MAX_LOGS = 200;
let startupMessage = "";

function pushLog(arr, line) {
  arr.push(line);
  if (arr.length > MAX_LOGS) arr.shift();
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
        } catch { }
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
            } catch { }
          }
        }
      } catch { }
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
      } catch { } // déjà mort
    }
  } catch { }
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
  } catch { }
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
    console.log("[Launcher] ⚡ dist/ trouvé — démarrage rapide (node dist/main)...");
  } else {
    console.log("[Launcher] ⚠️  dist/ absent — démarrage lent en mode dev (peut prendre 30-60s)...");
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

// ── Page HTML du launcher ──────────────────────────────────────────────────

function getHTML() {
  const env = loadEnv();
  const dbUrl = env.DATABASE_URL || "non configuré";
  const dbHost = dbUrl.includes("@") ? dbUrl.split("@")[1]?.split("/")[0] : "?";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Immo SaaS — Launcher</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .header {
      text-align: center;
      padding: 40px 20px 20px;
    }
    .logo {
      width: 80px; height: 80px;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 8px 32px rgba(59,130,246,0.3);
      font-size: 36px;
    }
    .header h1 { font-size: 28px; font-weight: 700; color: #fff; }
    .header p { color: #94a3b8; margin-top: 4px; font-size: 14px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      max-width: 900px;
      width: 100%;
      padding: 0 20px;
      margin-top: 20px;
    }
    .card {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 16px;
      padding: 24px;
      backdrop-filter: blur(10px);
    }
    .card h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 16px; }
    .status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid rgba(148,163,184,0.1);
    }
    .status-row:last-child { border-bottom: none; }
    .status-row .label { font-size: 14px; color: #cbd5e1; }
    .status-row .badge {
      font-size: 12px; font-weight: 600;
      padding: 3px 10px; border-radius: 20px;
    }
    .badge.ok { background: rgba(34,197,94,0.15); color: #4ade80; }
    .badge.loading { background: rgba(250,204,21,0.15); color: #facc15; }
    .badge.off { background: rgba(239,68,68,0.15); color: #f87171; }
    .btn-restart {
      display: block; width: 100%; margin-top: 12px;
      padding: 10px; border: 1px solid rgba(59,130,246,0.3);
      background: rgba(59,130,246,0.1); color: #93c5fd;
      border-radius: 8px; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-restart:hover { background: rgba(59,130,246,0.25); color: #bfdbfe; }
    .btn-restart:disabled { opacity: 0.5; cursor: not-allowed; }
    .links { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
    .links a {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px;
      background: rgba(59,130,246,0.1);
      border: 1px solid rgba(59,130,246,0.2);
      border-radius: 12px;
      color: #93c5fd;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .links a:hover { background: rgba(59,130,246,0.2); color: #bfdbfe; }
    .links a .arrow { margin-left: auto; opacity: 0.5; }
    .logs-card { grid-column: 1 / -1; }
    .logs-box {
      background: #0f172a;
      border-radius: 8px;
      padding: 12px;
      max-height: 200px;
      overflow-y: auto;
      font-family: 'Cascadia Code', 'Fira Code', monospace;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
    .info-row { font-size: 12px; color: #64748b; padding: 6px 0; }
    .info-row span { color: #94a3b8; }
    .footer { padding: 30px 20px; text-align: center; color: #475569; font-size: 12px; }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
    .badge.loading { animation: pulse 1.5s infinite; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🏠</div>
    <h1>Immo SaaS</h1>
    <p>CRM Immobilier — Launcher v2.0</p>
    ${startupMessage ? `<p style="margin-top:8px;padding:6px 16px;background:rgba(59,130,246,0.15);border-radius:8px;font-size:13px;color:#93c5fd;display:inline-block">${startupMessage}</p>` : ""}
  </div>

  <div class="grid">
    <!-- Services -->
    <div class="card">
      <h2>⚡ Services</h2>
      <div class="status-row">
        <span class="label">Backend NestJS (:${BACKEND_PORT})</span>
        <span class="badge ${backendReady ? "ok" : backendProcess ? "loading" : "off"}">${backendReady ? "● En ligne" : backendProcess ? "⟳ Démarrage..." : "○ Arrêté"}</span>
      </div>
      <div class="status-row">
        <span class="label">Frontend Next.js (:${FRONTEND_PORT})</span>
        <span class="badge ${frontendReady ? "ok" : frontendProcess ? "loading" : "off"}">${frontendReady ? "● En ligne" : frontendProcess ? "⟳ Démarrage..." : "○ Arrêté"}</span>
      </div>
      <div class="status-row">
        <span class="label">Base PostgreSQL</span>
        <span class="badge ok">● ${dbHost}</span>
      </div>
      <div class="info-row">DB : <span>${dbUrl.split("/").pop()?.split("?")[0] || "?"}</span></div>
      <button class="btn-restart" onclick="doRestart(this)">🔄 Redémarrer les services</button>
      <button class="btn-restart" style="margin-top:6px;border-color:rgba(168,85,247,0.3);background:rgba(168,85,247,0.1);color:#c4b5fd" onclick="doRebuild(this)">🔨 Rebuild backend (code modifié)</button>
    </div>

    <!-- Accès rapide -->
    <div class="card">
      <h2>🔗 Accès rapide</h2>
      <div class="links">
        <a href="http://localhost:${FRONTEND_PORT}" target="_blank">
          📱 Application SaaS
          <span class="arrow">→</span>
        </a>
        <a href="http://localhost:${BACKEND_PORT}/api" target="_blank">
          ⚙️ API Backend
          <span class="arrow">→</span>
        </a>
        <a href="http://localhost:${FRONTEND_PORT}/login" target="_blank">
          🔐 Page de login
          <span class="arrow">→</span>
        </a>
        <a href="http://localhost:${FRONTEND_PORT}/dashboard" target="_blank">
          📊 Dashboard
          <span class="arrow">→</span>
        </a>
        <a href="http://localhost:${FRONTEND_PORT}/sites/demo" target="_blank">
          🌐 Vitrine publique (demo)
          <span class="arrow">→</span>
        </a>
      </div>
    </div>

    <!-- Logs -->
    <div class="card logs-card">
      <h2>📋 Logs récents</h2>
      <div class="logs-box" id="logs">
        ${[...backendLogs.slice(-15), ...frontendLogs.slice(-15)]
      .map((l) => l.replace(/</g, "&lt;"))
      .join("<br>") || "<em>En attente de logs...</em>"
    }
      </div>
    </div>
  </div>

  <div class="footer">
    Immo SaaS © ${new Date().getFullYear()} — Launcher actif sur http://localhost:${LAUNCHER_PORT}
  </div>

  <script>
    setTimeout(() => location.reload(), ${backendReady && frontendReady ? 15000 : 3000});
    function doRestart(btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Redémarrage en cours...';
      fetch('/api/restart', { method: 'POST' })
        .then(() => { setTimeout(() => location.reload(), 3000); })
        .catch(() => { btn.disabled = false; btn.textContent = '🔄 Redémarrer les services'; });
    }
    function doRebuild(btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Rebuild en cours (1-2 min)...';
      fetch('/api/rebuild', { method: 'POST' })
        .then(() => { setTimeout(() => location.reload(), 5000); })
        .catch(() => { btn.disabled = false; btn.textContent = '🔨 Rebuild backend (code modifié)'; });
    }
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
    },
    frontend: {
      running: !!frontendProcess,
      ready: frontendReady,
      port: FRONTEND_PORT,
    },
    logs: {
      backend: backendLogs.slice(-20),
      frontend: frontendLogs.slice(-20),
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
    buildProc.stdout.on("data", (d) => pushLog(backendLogs, "[BUILD] " + d.toString().trim()));
    buildProc.stderr.on("data", (d) => pushLog(backendLogs, "[BUILD] " + d.toString().trim()));
    buildProc.on("exit", (code) => {
      if (code === 0) {
        startupMessage = "✅ Rebuild terminé — redémarrage rapide...";
        console.log("[Launcher] ✅ Build OK — démarrage prod...");
        startBackend();
        startReadinessPoller();
      } else {
        startupMessage = "❌ Rebuild échoué (code " + code + ") — voir les logs";
        console.log("[Launcher] ❌ Build échoué (code " + code + ")");
      }
    });
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

  server.listen(LAUNCHER_PORT, () => {
    writePidFile();
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║        🏠  Immo SaaS — Launcher                      ║
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
    } catch { }
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
