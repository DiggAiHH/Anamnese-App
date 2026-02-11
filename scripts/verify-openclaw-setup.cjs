#!/usr/bin/env node
/**
 * OpenClaw Setup Verification Script
 * 
 * Checks that all OpenClaw components are properly configured and ready to use.
 * Run this after setup to verify everything is in place.
 */

const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const NC = '\x1b[0m';

const checks = [];
let failures = 0;

function check(name, fn) {
  checks.push({ name, fn });
}

function success(msg) {
  console.log(`${GREEN}✓${NC} ${msg}`);
}

function failure(msg) {
  console.log(`${RED}✗${NC} ${msg}`);
  failures++;
}

function warning(msg) {
  console.log(`${YELLOW}⚠${NC} ${msg}`);
}

function info(msg) {
  console.log(`${BLUE}ℹ${NC} ${msg}`);
}

// ============================================================================
// Checks
// ============================================================================

check('OpenClaw config exists', () => {
  const configPath = '.openclaw/openclaw.json';
  if (!fs.existsSync(configPath)) {
    failure(`${configPath} not found`);
    return;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.version && config.agent) {
      success(`OpenClaw config valid (version: ${config.version})`);
    } else {
      failure('OpenClaw config malformed');
    }
  } catch (err) {
    failure(`OpenClaw config invalid JSON: ${err.message}`);
  }
});

check('Skills directory', () => {
  const skillsPath = '.openclaw/skills';
  if (!fs.existsSync(skillsPath)) {
    failure(`${skillsPath} not found`);
    return;
  }
  
  const skills = fs.readdirSync(skillsPath).filter(f => {
    const stat = fs.statSync(path.join(skillsPath, f));
    return stat.isDirectory();
  });
  
  if (skills.length > 0) {
    success(`Skills directory OK (${skills.length} skills: ${skills.join(', ')})`);
  } else {
    warning('Skills directory exists but is empty');
  }
});

check('Prompts directory', () => {
  const promptsPath = '.openclaw/prompts';
  if (!fs.existsSync(promptsPath)) {
    failure(`${promptsPath} not found`);
    return;
  }
  
  const prompts = fs.readdirSync(promptsPath).filter(f => f.endsWith('.md'));
  
  if (prompts.length > 0) {
    success(`Prompts directory OK (${prompts.length} prompts)`);
  } else {
    warning('Prompts directory exists but is empty');
  }
});

check('Build logs directory', () => {
  const buildLogsPath = 'buildLogs/openclaw';
  if (!fs.existsSync(buildLogsPath)) {
    warning(`${buildLogsPath} not found (will be created on first run)`);
  } else {
    success('Build logs directory OK');
  }
});

check('CURRENT_TASKS.md', () => {
  const tasksPath = 'CURRENT_TASKS.md';
  if (!fs.existsSync(tasksPath)) {
    warning(`${tasksPath} not found (recommended for agent coordination)`);
  } else {
    success('CURRENT_TASKS.md exists');
  }
});

check('Git pre-push hook', () => {
  const hookPath = '.git/hooks/pre-push';
  if (!fs.existsSync(hookPath)) {
    warning('Git pre-push hook not installed (run: cp scripts/git-pre-push-hook.sh .git/hooks/pre-push && chmod +x .git/hooks/pre-push)');
  } else {
    success('Git pre-push hook installed');
  }
});

check('OpenClaw scripts', () => {
  const scripts = [
    'scripts/openclaw-setup-wsl2.sh',
    'scripts/openclaw-setup-windows.ps1',
    'scripts/openclaw-start.sh',
    'scripts/openclaw-start.ps1',
    'scripts/openclaw-pentest.cjs',
    'scripts/copilot-bridge.cjs'
  ];
  
  const missing = scripts.filter(s => !fs.existsSync(s));
  const existing = scripts.filter(s => fs.existsSync(s));
  
  if (missing.length === 0) {
    success(`All ${scripts.length} OpenClaw scripts present`);
  } else {
    failure(`Missing scripts: ${missing.join(', ')}`);
  }
});

check('Package.json scripts', () => {
  const pkgPath = 'package.json';
  if (!fs.existsSync(pkgPath)) {
    failure('package.json not found');
    return;
  }
  
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const requiredScripts = [
    'openclaw:setup:wsl',
    'openclaw:setup:win',
    'openclaw:pentest',
    'openclaw:bridge',
    'openclaw:start'
  ];
  
  const missing = requiredScripts.filter(s => !pkg.scripts || !pkg.scripts[s]);
  
  if (missing.length === 0) {
    success('All OpenClaw npm scripts configured');
  } else {
    failure(`Missing npm scripts: ${missing.join(', ')}`);
  }
});

check('MEMORY.md', () => {
  const memoryPath = 'MEMORY.md';
  if (!fs.existsSync(memoryPath)) {
    warning('MEMORY.md not found (recommended for long-term agent memory)');
  } else {
    success('MEMORY.md exists (shared ground truth)');
  }
});

check('LAUFBAHN.md', () => {
  const laufbahnPath = 'LAUFBAHN.md';
  if (!fs.existsSync(laufbahnPath)) {
    warning('LAUFBAHN.md not found (recommended for execution log)');
  } else {
    success('LAUFBAHN.md exists (agent runbook)');
  }
});

check('.gitignore coverage', () => {
  const gitignorePath = '.gitignore';
  if (!fs.existsSync(gitignorePath)) {
    failure('.gitignore not found');
    return;
  }
  
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  const required = [
    'buildLogs/openclaw/',
    'buildLogs/pentest_report_*.md',
    'CURRENT_TASKS.md'
  ];
  
  const missing = required.filter(pattern => !gitignore.includes(pattern));
  
  if (missing.length === 0) {
    success('.gitignore properly configured for OpenClaw');
  } else {
    warning(`.gitignore missing patterns: ${missing.join(', ')}`);
  }
});

// ============================================================================
// Run Checks
// ============================================================================

console.log(`\n${BLUE}═══════════════════════════════════════════════════════${NC}`);
console.log(`${BLUE}OpenClaw Setup Verification${NC}`);
console.log(`${BLUE}═══════════════════════════════════════════════════════${NC}\n`);

checks.forEach(({ name, fn }) => {
  try {
    fn();
  } catch (err) {
    failure(`${name}: ${err.message}`);
  }
});

// ============================================================================
// Summary
// ============================================================================

console.log(`\n${BLUE}═══════════════════════════════════════════════════════${NC}`);

if (failures === 0) {
  console.log(`${GREEN}✓ All checks passed! OpenClaw is ready to use.${NC}\n`);
  info('Next steps:');
  info('  1. Run setup: npm run openclaw:setup:wsl (or :win on Windows)');
  info('  2. Start stack: npm run openclaw:start (or :start:win on Windows)');
  info('  3. Check logs: buildLogs/openclaw/');
  process.exit(0);
} else {
  console.log(`${RED}✗ ${failures} check(s) failed. Please fix the issues above.${NC}\n`);
  process.exit(1);
}
