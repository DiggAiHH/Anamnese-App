#!/usr/bin/env node
/**
 * Copilot API Bridge for OpenClaw
 * 
 * Bridges GitHub Copilot's LLM API to OpenClaw's model gateway.
 * Uses GitHub's authenticated Copilot token to provide LLM access
 * without requiring separate API keys (Anthropic/OpenAI).
 *
 * Architecture:
 *   OpenClaw Agent → Model Router (task_routing) → This Bridge → GitHub Copilot API
 *
 * Auth Flow:
 *   1. `gh auth token` → GitHub PAT
 *   2. PAT → Copilot internal token exchange (via copilot-internals)
 *   3. Copilot token → Model endpoint calls
 *
 * @security No PII passes through this bridge. All requests are code/task related.
 */
'use strict';

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Configuration ──────────────────────────────────────────────────────
const PORT = parseInt(process.env.COPILOT_BRIDGE_PORT || '18790', 10);
const BIND = process.env.COPILOT_BRIDGE_BIND || '127.0.0.1';
const LOG_DIR = path.join(__dirname, '..', 'buildLogs', 'openclaw');

// Model mapping: OpenClaw model alias → Copilot API model ID
const MODEL_MAP = {
  'copilot-gpt4o':          'gpt-4o',
  'copilot-claude-sonnet':  'claude-3.5-sonnet',
  'copilot-claude-haiku':   'claude-3.5-haiku',
  'copilot-o1':             'o1',
  'copilot-o3-mini':        'o3-mini',
  // Fallback
  'default':                'gpt-4o',
};

// Task → Model routing (mirrors openclaw.json but runtime-enforceable)
const TASK_ROUTING = {
  'code-generation':       'copilot-gpt4o',
  'code-review':           'copilot-claude-sonnet',
  'refactoring':           'copilot-gpt4o',
  'debugging':             'copilot-gpt4o',
  'complex-debugging':     'copilot-o1',
  'architecture':          'copilot-claude-sonnet',
  'architecture-review':   'copilot-o1',
  'research':              'copilot-claude-sonnet',
  'security-audit':        'copilot-claude-sonnet',
  'security-deep-analysis':'copilot-o1',
  'test-generation':       'copilot-o3-mini',
  'i18n-translation':      'copilot-claude-haiku',
  'quick-tasks':           'copilot-claude-haiku',
  'log-analysis':          'copilot-claude-haiku',
  'formatting':            'copilot-claude-haiku',
  'dependency-analysis':   'copilot-o3-mini',
  'complex-reasoning':     'copilot-claude-sonnet',
  'default':               'copilot-gpt4o',
};

// ── Auth ───────────────────────────────────────────────────────────────
function getGitHubToken() {
  // Priority: env var → gh cli
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GITHUB_COPILOT_TOKEN) return process.env.GITHUB_COPILOT_TOKEN;
  
  try {
    const token = execSync('gh auth token', { encoding: 'utf-8', timeout: 5000 }).trim();
    if (token) return token;
  } catch {
    // gh not available
  }
  
  return null;
}

function getCopilotToken(githubToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: '/copilot_internal/v2/token',
      method: 'GET',
      headers: {
        'Authorization': `token ${githubToken}`,
        'User-Agent': 'openclaw-bridge/1.0',
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.token) {
            resolve({ token: parsed.token, expires_at: parsed.expires_at });
          } else {
            reject(new Error(`No token in response: ${data.slice(0, 200)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// ── Token Cache ────────────────────────────────────────────────────────
let cachedCopilotToken = null;
let tokenExpiresAt = 0;

async function ensureCopilotToken() {
  const now = Date.now();
  if (cachedCopilotToken && tokenExpiresAt > now + 60000) {
    return cachedCopilotToken;
  }

  const githubToken = getGitHubToken();
  if (!githubToken) {
    throw new Error('No GitHub token available. Run: gh auth login');
  }

  const result = await getCopilotToken(githubToken);
  cachedCopilotToken = result.token;
  tokenExpiresAt = new Date(result.expires_at).getTime();
  
  log('info', `Copilot token refreshed, expires: ${result.expires_at}`);
  return cachedCopilotToken;
}

// ── Copilot API Call ───────────────────────────────────────────────────
function callCopilotAPI(token, modelId, messages, options = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: modelId,
      messages,
      max_tokens: options.max_tokens || 8192,
      temperature: options.temperature ?? 0.1,
      stream: options.stream || false,
      ...(options.tools ? { tools: options.tools } : {}),
    });

    const reqOptions = {
      hostname: 'api.githubcopilot.com',
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Copilot-Integration-Id': 'openclaw-bridge',
        'Editor-Version': 'vscode/1.96.0',
        'User-Agent': 'openclaw-bridge/1.0',
      },
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ raw: data });
          }
        } else {
          reject(new Error(`Copilot API ${res.statusCode}: ${data.slice(0, 500)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Logging ────────────────────────────────────────────────────────────
function log(level, msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${level.toUpperCase()}] ${msg}`;
  console.log(line);
  
  // Append to log file (no PII)
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(
      path.join(LOG_DIR, 'copilot_bridge.log'),
      line + '\n'
    );
  } catch { /* ignore log errors */ }
}

// ── Request Counter / Metrics ──────────────────────────────────────────
const metrics = {
  total_requests: 0,
  by_model: {},
  by_task: {},
  errors: 0,
  started_at: new Date().toISOString(),
};

function trackRequest(model, task) {
  metrics.total_requests++;
  metrics.by_model[model] = (metrics.by_model[model] || 0) + 1;
  metrics.by_task[task] = (metrics.by_task[task] || 0) + 1;
}

// ── HTTP Server ────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', models: Object.keys(MODEL_MAP), metrics }));
    return;
  }

  // Model list endpoint (OpenAI-compatible)
  if (req.method === 'GET' && req.url === '/v1/models') {
    const models = Object.entries(MODEL_MAP)
      .filter(([k]) => k !== 'default')
      .map(([alias, id]) => ({ id: alias, object: 'model', copilot_id: id }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: models }));
    return;
  }

  // Route endpoint — resolve task to model
  if (req.method === 'GET' && req.url?.startsWith('/v1/route/')) {
    const task = req.url.split('/v1/route/')[1];
    const model = TASK_ROUTING[task] || TASK_ROUTING['default'];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ task, model, copilot_id: MODEL_MAP[model] }));
    return;
  }

  // Chat completions (OpenAI-compatible)
  if (req.method === 'POST' && req.url === '/v1/chat/completions') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const requestedModel = payload.model || 'default';
        const task = payload.task || 'default'; // custom field for task routing
        
        // Resolve model: explicit model > task routing > default
        let modelAlias = requestedModel;
        if (requestedModel === 'auto' || requestedModel === 'default') {
          modelAlias = TASK_ROUTING[task] || TASK_ROUTING['default'];
        }
        
        const copilotModelId = MODEL_MAP[modelAlias] || MODEL_MAP['default'];
        
        log('info', `Request: model=${modelAlias} (${copilotModelId}), task=${task}, messages=${payload.messages?.length || 0}`);
        trackRequest(modelAlias, task);

        const token = await ensureCopilotToken();
        const result = await callCopilotAPI(token, copilotModelId, payload.messages, {
          max_tokens: payload.max_tokens,
          temperature: payload.temperature,
          stream: payload.stream,
          tools: payload.tools,
        });

        // Add routing metadata
        result._bridge = {
          model_alias: modelAlias,
          copilot_model_id: copilotModelId,
          task,
          routed_at: new Date().toISOString(),
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        metrics.errors++;
        log('error', `Request failed: ${err.message}`);
        res.writeHead(err.message.includes('401') ? 401 : 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Metrics endpoint
  if (req.method === 'GET' && req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metrics, null, 2));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// ── Start ──────────────────────────────────────────────────────────────
server.listen(PORT, BIND, () => {
  log('info', `Copilot Bridge running on ${BIND}:${PORT}`);
  log('info', `Models available: ${Object.keys(MODEL_MAP).filter(k => k !== 'default').join(', ')}`);
  log('info', `Endpoints:`);
  log('info', `  POST /v1/chat/completions  — OpenAI-compatible chat`);
  log('info', `  GET  /v1/models            — List models`);
  log('info', `  GET  /v1/route/<task>       — Resolve task → model`);
  log('info', `  GET  /health               — Health check`);
  log('info', `  GET  /metrics              — Usage metrics`);
});

process.on('SIGINT', () => {
  log('info', 'Shutting down Copilot Bridge...');
  server.close();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  log('error', `Uncaught: ${err.message}`);
});
