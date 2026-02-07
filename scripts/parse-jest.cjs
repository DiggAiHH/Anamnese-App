const d = JSON.parse(require('fs').readFileSync('c:/Users/tubbeTEC/Desktop/Projects/Anamnese-App/Anamnese-App/buildLogs/jest_phase2_i3.json', 'utf-8'));
console.log('SUITES=' + d.numTotalTestSuites + ' PASS=' + d.numPassedTestSuites + ' FAIL=' + d.numFailedTestSuites);
console.log('TESTS=' + d.numTotalTests + ' PASS=' + d.numPassedTests + ' FAIL=' + d.numFailedTests + ' PEND=' + d.numPendingTests);
console.log('SUCCESS=' + d.success);
if (d.numFailedTests > 0) {
  d.testResults.forEach(s => s.assertionResults.filter(t => t.status === 'failed').forEach(t => console.log('FAILTEST: ' + t.fullName)));
}
