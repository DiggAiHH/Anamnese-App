const { execSync } = require('child_process');
const fs = require('fs');
const root = 'c:/Users/tubbeTEC/Desktop/Projects/Anamnese-App/Anamnese-App';
const outFile = root + '/buildLogs/jest_i3.json';

try {
  const r = execSync('npx jest --no-coverage --forceExit --json', { cwd: root, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 300000 });
  fs.writeFileSync(outFile, r);
} catch (e) {
  if (e.stdout) fs.writeFileSync(outFile, e.stdout);
  else { console.error('NO OUTPUT'); process.exit(1); }
}
const d = JSON.parse(fs.readFileSync(outFile, 'utf-8'));
console.log('S=' + d.numTotalTestSuites + ' SP=' + d.numPassedTestSuites + ' SF=' + d.numFailedTestSuites);
console.log('T=' + d.numTotalTests + ' TP=' + d.numPassedTests + ' TF=' + d.numFailedTests + ' PN=' + d.numPendingTests);
console.log('OK=' + d.success);
if (d.numFailedTests > 0) d.testResults.forEach(s => s.assertionResults.filter(t => t.status === 'failed').forEach(t => console.log('F:' + t.fullName)));
