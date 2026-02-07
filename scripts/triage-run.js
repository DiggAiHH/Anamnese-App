const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function pad2(n) {
  return String(n).padStart(2, '0');
}

function timestampForFilename(date) {
  return (
    date.getFullYear() +
    pad2(date.getMonth() + 1) +
    pad2(date.getDate()) +
    '_' +
    pad2(date.getHours()) +
    pad2(date.getMinutes()) +
    pad2(date.getSeconds())
  );
}

function parseArgs(argv) {
  const args = {
    name: 'cmd',
    cwd: process.cwd(),
    command: null,
    commandArgs: [],
  };

  const doubleDashIndex = argv.indexOf('--');
  const flags = doubleDashIndex === -1 ? argv : argv.slice(0, doubleDashIndex);
  const cmd = doubleDashIndex === -1 ? [] : argv.slice(doubleDashIndex + 1);

  for (let i = 0; i < flags.length; i++) {
    const token = flags[i];
    if (token === '--name') {
      args.name = String(flags[i + 1] || '').trim() || args.name;
      i++;
      continue;
    }
    if (token === '--cwd') {
      args.cwd = String(flags[i + 1] || '').trim() || args.cwd;
      i++;
      continue;
    }
  }

  if (cmd.length === 0) {
    return args;
  }

  args.command = cmd[0];
  args.commandArgs = cmd.slice(1);
  return args;
}

function normalizeCommandForPlatform(command) {
  if (process.platform !== 'win32') return command;

  const lower = command.toLowerCase();
  const needsCmdShim = lower === 'npm' || lower === 'npx' || lower === 'yarn' || lower === 'pnpm';
  if (!needsCmdShim) return command;

  if (lower.endsWith('.cmd') || lower.endsWith('.exe') || lower.endsWith('.bat')) return command;
  return `${command}.cmd`;
}

function buildSpawnSpec(command, commandArgs) {
  if (process.platform !== 'win32') {
    return { file: command, args: commandArgs };
  }

  const lower = command.toLowerCase();
  const isCmdShim = lower.endsWith('.cmd') || lower.endsWith('.bat');
  if (!isCmdShim) {
    return { file: command, args: commandArgs };
  }

  // On Windows, .cmd/.bat are not directly executable by CreateProcess.
  // Wrap them with cmd.exe to avoid spawn EINVAL.
  return { file: 'cmd.exe', args: ['/d', '/c', command, ...commandArgs] };
}

function buildSummary(lines) {
  const interesting = [];
  const patterns = [
    /\bFAIL\b/i,
    /\bERROR\b/i,
    /\bTypeError\b/i,
    /\bReferenceError\b/i,
    /\bSyntaxError\b/i,
    /Invariant Violation/i,
    /^\s*at\s+.+\(.+\)$/,
    /^\s*\u25cf\s+/, // Jest "●"
  ];

  for (const line of lines) {
    if (patterns.some(re => re.test(line))) {
      interesting.push(line);
    }
  }

  // De-duplicate while preserving order
  const seen = new Set();
  const deduped = [];
  for (const line of interesting) {
    const key = line.trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(line);
  }

  return deduped;
}

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);

  if (!args.command) {
    console.error('Usage: node scripts/triage-run.js --name <label> -- <command> [args...]');
    process.exit(2);
    return;
  }

  const buildLogsDir = path.resolve(process.cwd(), 'buildLogs');
  fs.mkdirSync(buildLogsDir, { recursive: true });

  const stamp = timestampForFilename(new Date());
  const safeName = args.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
  const logPath = path.join(buildLogsDir, `triage_${safeName}_${stamp}.log`);
  const summaryPath = path.join(buildLogsDir, `triage_${safeName}_${stamp}.summary.txt`);

  const logStream = fs.createWriteStream(logPath, { flags: 'wx' });
  const allLines = [];

  const normalizedCommand = normalizeCommandForPlatform(args.command);

  const spec = buildSpawnSpec(normalizedCommand, args.commandArgs);
  const child = spawn(spec.file, spec.args, {
    cwd: args.cwd,
    shell: false,
    env: process.env,
  });

  function onChunk(chunk, isErr) {
    const text = chunk.toString('utf8');
    logStream.write(text);

    // Keep a bounded buffer for summary parsing
    const newLines = text.split(/\r?\n/);
    for (const line of newLines) {
      if (line.length === 0) continue;
      allLines.push(line);
      if (allLines.length > 8000) allLines.shift();
    }

    if (isErr) process.stderr.write(text);
    else process.stdout.write(text);
  }

  child.stdout.on('data', c => onChunk(c, false));
  child.stderr.on('data', c => onChunk(c, true));

  child.on('error', err => {
    const msg = `[triage] failed to start process: ${err && err.message ? err.message : String(err)}`;
    logStream.write(`\n${msg}\n`);
    console.error(msg);

    const summary = [
      `triage.name=${safeName}`,
      `triage.cwd=${args.cwd}`,
      `triage.command=${spec.file} ${spec.args.join(' ')}`,
      'triage.exitCode=1',
      `triage.log=${logPath}`,
      '',
      '--- summary (filtered) ---',
      msg,
      '',
    ].join('\n');
    try {
      fs.writeFileSync(summaryPath, summary, { encoding: 'utf8' });
    } catch {
      // ignore
    }
    try {
      logStream.end();
    } catch {
      // ignore
    }
    process.exit(1);
  });

  child.on('close', code => {
    logStream.end();

    const summaryLines = buildSummary(allLines);
    const summary = [
      `triage.name=${safeName}`,
      `triage.cwd=${args.cwd}`,
      `triage.command=${spec.file} ${spec.args.join(' ')}`,
      `triage.exitCode=${code}`,
      `triage.log=${logPath}`,
      '',
      '--- summary (filtered) ---',
      ...(summaryLines.length
        ? summaryLines
        : ['(no error patterns matched; check full log if needed)']),
      '',
    ].join('\n');

    fs.writeFileSync(summaryPath, summary, { encoding: 'utf8' });

    console.log(`\n[triage] log: ${logPath}`);
    console.log(`[triage] summary: ${summaryPath}`);
    process.exit(code ?? 1);
  });
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
