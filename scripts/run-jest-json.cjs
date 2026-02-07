#!/usr/bin/env node
/**
 * Run Jest with JSON output and write results to buildLogs/jest_phase2_i3.json
 * Then print summary to stdout.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outFile = path.join(root, 'buildLogs', 'jest_phase2_i3.json');

try {
  const result = execSync('npx jest --no-coverage --forceExit --json', {
    cwd: root,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 300000,
  });
  fs.writeFileSync(outFile, result, 'utf-8');
} catch (err) {
  // Jest exits with code 1 on failures but still produces JSON on stdout
  if (err.stdout) {
    fs.writeFileSync(outFile, err.stdout, 'utf-8');
  } else {
    console.error('Jest failed without JSON output:', err.message);
    process.exit(1);
  }
}

// Parse and print summary
try {
  const raw = fs.readFileSync(outFile, 'utf-8');
  const d = JSON.parse(raw);
  console.log(`suites: ${d.numTotalTestSuites} passed: ${d.numPassedTestSuites} failed: ${d.numFailedTestSuites}`);
  console.log(`tests: ${d.numTotalTests} passed: ${d.numPassedTests} failed: ${d.numFailedTests} pending: ${d.numPendingTests} todo: ${d.numTodoTests}`);
  console.log(`success: ${d.success}`);
  
  if (d.numFailedTests > 0) {
    console.log('\n--- FAILURES ---');
    for (const suite of d.testResults) {
      for (const test of suite.assertionResults) {
        if (test.status === 'failed') {
          console.log(`FAIL: ${test.ancestorTitles.join(' > ')} > ${test.title}`);
          if (test.failureMessages) {
            console.log(test.failureMessages[0].substring(0, 500));
          }
        }
      }
    }
  }
} catch (parseErr) {
  console.error('Failed to parse JSON:', parseErr.message);
}
