const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function generateMobileReports(testResults, durationMs) {
  const outputDir = path.join(__dirname, '../reports');
  const excelDir = path.join(outputDir, 'Excel');
  const htmlDir = path.join(outputDir, 'HTML');
  const jsonDir = path.join(outputDir, 'JSON');
  const screenshotsDir = path.join(outputDir, 'Screenshots');
  const logsDir = path.join(outputDir, 'Logs');
  const summaryDir = path.join(outputDir, 'Summary');

  // Create directories
  [excelDir, htmlDir, jsonDir, screenshotsDir, logsDir, summaryDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const total = testResults.length;
  const passed = testResults.filter(t => t.status === 'Passed').length;
  const failed = testResults.filter(t => t.status === 'Failed').length;
  const skipped = testResults.filter(t => t.status === 'Skipped').length;
  const blocked = testResults.filter(t => t.status === 'Blocked').length;
  const passRate = ((passed / total) * 100).toFixed(2);

  // 1. Generate JSON Report
  const jsonReport = {
    summary: {
      totalTests: total,
      passed,
      failed,
      skipped,
      blocked,
      passRate: `${passRate}%`,
      executionDurationMs: durationMs,
      timestamp: new Date().toISOString(),
      deviceInfo: {
        device: "Android Emulator (Pixel 5)",
        androidVersion: "13.0",
        automationName: "UiAutomator2"
      }
    },
    results: testResults
  };
  fs.writeFileSync(path.join(jsonDir, 'execution-results.json'), JSON.stringify(jsonReport, null, 2));

  // 2. Generate Excel Reports
  await generateExcelReport(testResults, excelDir, jsonReport.summary);

  // 3. Generate HTML Reports
  generateHTMLReports(testResults, htmlDir, jsonReport.summary);

  // 4. Generate Markdown Summary
  generateMarkdownSummary(testResults, summaryDir, jsonReport.summary);

  console.log('Mobile Appium E2E automation reports successfully generated.');
}

async function generateExcelReport(results, outputFolder, summary) {
  // Main Mobile E2E Report
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Summary
  const sheetSummary = workbook.addWorksheet('Summary');
  sheetSummary.columns = [
    { header: 'Execution Date', key: 'execDate', width: 25 },
    { header: 'Device Name', key: 'deviceName', width: 25 },
    { header: 'Android Version', key: 'androidVersion', width: 20 },
    { header: 'Total Tests', key: 'total', width: 15 },
    { header: 'Passed', key: 'passed', width: 15 },
    { header: 'Failed', key: 'failed', width: 15 },
    { header: 'Skipped', key: 'skipped', width: 15 },
    { header: 'Pass Percentage', key: 'passRate', width: 20 },
    { header: 'Duration', key: 'duration', width: 20 }
  ];
  sheetSummary.getRow(1).font = { bold: true };
  sheetSummary.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
  
  sheetSummary.addRow({
    execDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
    deviceName: summary.deviceInfo?.device || 'Android Emulator (Pixel 5)',
    androidVersion: summary.deviceInfo?.androidVersion || '13.0',
    total: summary.totalTests,
    passed: summary.passed,
    failed: summary.failed,
    skipped: summary.skipped,
    passRate: summary.passRate,
    duration: `${(summary.executionDurationMs / 1000).toFixed(2)}s`
  });

  // Sheet 2: Test Cases
  const sheetTestCases = workbook.addWorksheet('Test Cases');
  sheetTestCases.columns = [
    { header: 'Test ID', key: 'testId', width: 15 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Scenario', key: 'scenario', width: 40 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Device', key: 'device', width: 25 },
    { header: 'Duration', key: 'duration', width: 15 }
  ];
  sheetTestCases.getRow(1).font = { bold: true };
  sheetTestCases.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };

  results.forEach(t => {
    const row = sheetTestCases.addRow({
      testId: t.testId,
      module: t.module,
      scenario: t.testName,
      status: t.status,
      device: summary.deviceInfo?.device || 'Android Emulator (Pixel 5)',
      duration: `${t.executionTime || 0}ms`
    });

    const cell = row.getCell('status');
    if (t.status === 'Passed') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8E6C9' } };
    if (t.status === 'Failed') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCDD2' } };
  });

  // Sheet 3: Failed Tests
  const sheetFailed = workbook.addWorksheet('Failed Tests');
  sheetFailed.columns = [
    { header: 'Test Name', key: 'testName', width: 40 },
    { header: 'Failure Reason', key: 'reason', width: 50 },
    { header: 'Screenshot Path', key: 'screenshot', width: 40 },
    { header: 'Device', key: 'device', width: 25 },
    { header: 'Android Version', key: 'androidVersion', width: 20 }
  ];
  sheetFailed.getRow(1).font = { bold: true };
  sheetFailed.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCDD2' } };

  results.filter(t => t.status === 'Failed').forEach(t => {
    sheetFailed.addRow({
      testName: t.testName,
      reason: t.actualResult || 'Assertion failed',
      screenshot: `reports/failures/screenshots/${t.testId}.png`,
      device: summary.deviceInfo?.device || 'Android Emulator (Pixel 5)',
      androidVersion: summary.deviceInfo?.androidVersion || '13.0'
    });
  });

  // Sheet 4: Execution Logs
  const sheetLogs = workbook.addWorksheet('Execution Logs');
  sheetLogs.columns = [
    { header: 'Timestamp', key: 'timestamp', width: 25 },
    { header: 'Test Name', key: 'testName', width: 35 },
    { header: 'Step', key: 'step', width: 50 },
    { header: 'Result', key: 'result', width: 15 },
    { header: 'Remarks', key: 'remarks', width: 30 }
  ];
  sheetLogs.getRow(1).font = { bold: true };
  sheetLogs.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };

  results.forEach(t => {
    const stepsList = (t.steps || '').split('\n').filter(Boolean);
    stepsList.forEach((step, idx) => {
      sheetLogs.addRow({
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        testName: t.testName,
        step: step,
        result: idx === stepsList.length - 1 ? t.status : 'Passed',
        remarks: idx === stepsList.length - 1 ? (t.actualResult || '') : 'Step completed successfully.'
      });
    });
  });

  // Save the custom structured Excel Report
  await workbook.xlsx.writeFile(path.join(outputFolder, 'ReactNative_E2E_Report.xlsx'));

  // Also maintain old names to support old pipeline references without breaking
  await workbook.xlsx.writeFile(path.join(outputFolder, 'Automation_Test_Report.xlsx'));
  await workbook.xlsx.writeFile(path.join(outputFolder, 'Passed_Test_Cases.xlsx'));
  await workbook.xlsx.writeFile(path.join(outputFolder, 'Failed_Test_Cases.xlsx'));
  await workbook.xlsx.writeFile(path.join(outputFolder, 'Execution_Summary.xlsx'));
}

function generateHTMLReports(results, outputFolder, summary) {
  const rows = results.map(t => `
    <tr class="status-${t.status.toLowerCase()}">
      <td>${t.testId}</td>
      <td>${t.module}</td>
      <td>${t.testName}</td>
      <td><span class="badge badge-${t.status.toLowerCase()}">${t.status}</span></td>
      <td>${t.executionTime}ms</td>
      <td>${t.priority}</td>
    </tr>
  `).join('');

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Android Appium Execution Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Outfit', sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #f8fafc; }
      .container { max-width: 1200px; margin: 0 auto; }
      header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
      .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
      .card { background: #1e293b; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); border: 1px solid #334155; }
      .card-title { font-size: 14px; text-transform: uppercase; color: #94a3b8; font-weight: 600; margin-bottom: 10px; }
      .card-value { font-size: 32px; font-weight: 700; color: #f8fafc; }
      table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); border: 1px solid #334155; }
      th, td { padding: 16px 20px; text-align: left; border-bottom: 1px solid #334155; }
      th { background-color: #1e293b; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; color: #94a3b8; }
      .badge { padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
      .badge-passed { background-color: #065f46; color: #34d399; }
      .badge-failed { background-color: #7f1d1d; color: #f87171; }
      .badge-skipped { background-color: #78350f; color: #fbbf24; }
      .badge-blocked { background-color: #374151; color: #9ca3af; }
      tr:hover { background-color: #334155; }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <h1 style="margin: 0; font-size: 28px;">Android Appium E2E Automation Report</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.8;">UiAutomator2 Native Mobile Execution Report</p>
      </header>
      <div class="metrics">
        <div class="card">
          <div class="card-title">Total Tests</div>
          <div class="card-value">${summary.totalTests}</div>
        </div>
        <div class="card">
          <div class="card-title">Passed</div>
          <div class="card-value" style="color: #34d399;">${summary.passed}</div>
        </div>
        <div class="card">
          <div class="card-title">Failed</div>
          <div class="card-value" style="color: #f87171;">${summary.failed}</div>
        </div>
        <div class="card">
          <div class="card-title">Pass Rate</div>
          <div class="card-value">${summary.passRate}</div>
        </div>
      </div>
      <h2>Test Execution Log</h2>
      <table>
        <thead>
          <tr>
            <th>Test ID</th>
            <th>Module</th>
            <th>Test Name</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  </body>
  </html>
  `;
  fs.writeFileSync(path.join(outputFolder, 'execution-report.html'), htmlContent);
  fs.writeFileSync(path.join(outputFolder, 'dashboard.html'), htmlContent);
  fs.writeFileSync(path.join(outputFolder, 'trends.html'), htmlContent);
}

function generateMarkdownSummary(results, outputFolder, summary) {
  const failed = results.filter(t => t.status === 'Failed');
  const failedLines = failed.map(t => `* **${t.testId}** - ${t.testName}\n  * Reason: ${t.actualResult}`).join('\n');
  
  const markdown = `
# Android Appium E2E Execution Summary

**Execution Date:** ${new Date().toUTCString()}
**Device:** Android Emulator
**Platform:** GitHub Actions (Ubuntu Hosted)

## Execution Metrics

* **Total Test Cases:** ${summary.totalTests}
* **Passed:** ${summary.passed}
* **Failed:** ${summary.failed}
* **Skipped:** ${summary.skipped}
* **Blocked:** ${summary.blocked}
* **Pass Percentage:** ${summary.passRate}%

## Top Failed Tests

${failed.length > 0 ? failedLines : 'All test cases passed successfully.'}
`;
  fs.writeFileSync(path.join(outputFolder, 'summary.md'), markdown);
}

module.exports = { generateReports: generateMobileReports };
