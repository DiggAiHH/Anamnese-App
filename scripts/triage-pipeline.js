const { spawnSync } = require('child_process');

function runStep(name, cmd) {
  const args = ['scripts/triage-run.js', '--name', name, '--', ...cmd];
  const res = spawnSync(process.execPath, args, { stdio: 'inherit', shell: false });
  return typeof res.status === 'number' ? res.status : 1;
}

function main() {
  // “Build” in this repo = fast compiler gate (tsc) to catch issues early.
  const buildCode = runStep('build', ['npm', 'run', 'type-check']);
  if (buildCode !== 0) process.exit(buildCode);

  const testCode = runStep('test', ['npm', 'test']);
  process.exit(testCode);
}

main();
