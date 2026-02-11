#!/usr/bin/env node
/**
 * OpenClaw Status Check
 * 
 * Quick runtime check to see if OpenClaw components are running and healthy.
 */

const http = require('http');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const NC = '\x1b[0m';

function success(msg) {
  console.log(`${GREEN}✓${NC} ${msg}`);
}

function failure(msg) {
  console.log(`${RED}✗${NC} ${msg}`);
}

function info(msg) {
  console.log(`${BLUE}ℹ${NC} ${msg}`);
}

function checkEndpoint(url, port, name) {
  return new Promise((resolve) => {
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: url,
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        success(`${name} is running (${port}${url})`);
        resolve(true);
      } else {
        failure(`${name} returned status ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      failure(`${name} not accessible: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      failure(`${name} timeout`);
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  console.log(`\n${BLUE}═══════════════════════════════════════════════════════${NC}`);
  console.log(`${BLUE}OpenClaw Status Check${NC}`);
  console.log(`${BLUE}═══════════════════════════════════════════════════════${NC}\n`);

  // Check Copilot Bridge
  info('Checking Copilot Bridge (port 18790)...');
  const bridgeOk = await checkEndpoint('/health', 18790, 'Copilot Bridge');

  // Check OpenClaw Gateway
  info('Checking OpenClaw Gateway (port 18789)...');
  const gatewayOk = await checkEndpoint('/', 18789, 'OpenClaw Gateway');

  console.log(`\n${BLUE}═══════════════════════════════════════════════════════${NC}`);

  if (bridgeOk && gatewayOk) {
    console.log(`${GREEN}✓ OpenClaw stack is running and healthy${NC}\n`);
    process.exit(0);
  } else {
    console.log(`${RED}✗ OpenClaw stack is not fully operational${NC}\n`);
    info('To start the stack:');
    info('  WSL2/Linux: npm run openclaw:start');
    info('  Windows:    npm run openclaw:start:win');
    console.log('');
    process.exit(1);
  }
}

main();
