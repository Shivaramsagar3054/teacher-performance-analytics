const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function generateReports(testResults, durationMs) {
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
        browser: "Chrome (Headless)",
        platform: "Windows 11",
        nodeVersion: process.version
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

  console.log('Web E2E automation reports successfully generated.');
}

async function generateExcelReport(results, outputFolder, summary) {
  // Main Report
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Executed Test Cases
  const sheet1 = workbook.addWorksheet('Executed Test Cases');
  sheet1.columns = [
    { header: 'Test ID', key: 'testId', width: 15 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Test Name', key: 'testName', width: 40 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Execution Time (ms)', key: 'executionTime', width: 20 },
    { header: 'Priority', key: 'priority', width: 15 }
  ];
  sheet1.getRow(1).font = { bold: true };
  sheet1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } };

  results.forEach(t => {
    const row = sheet1.addRow(t);
    const cell = row.getCell('status');
    if (t.status === 'Passed') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
    if (t.status === 'Failed') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
  });

  // Sheet 2: Passed Tests
  const sheet2 = workbook.addWorksheet('Passed Tests');
  sheet2.columns = sheet1.columns;
  sheet2.getRow(1).font = { bold: true };
  results.filter(t => t.status === 'Passed').forEach(t => sheet2.addRow(t));

  // Sheet 3: Failed Tests
  const sheet3 = workbook.addWorksheet('Failed Tests');
  sheet3.columns = sheet1.columns;
  sheet3.getRow(1).font = { bold: true };
  results.filter(t => t.status === 'Failed').forEach(t => sheet3.addRow(t));

  // Sheet 4: Skipped Tests
  const sheet4 = workbook.addWorksheet('Skipped Tests');
  sheet4.columns = sheet1.columns;
  sheet4.getRow(1).font = { bold: true };
  results.filter(t => t.status === 'Skipped').forEach(t => sheet4.addRow(t));

  // Sheet 5: Execution Metrics
  const sheet5 = workbook.addWorksheet('Execution Metrics');
  sheet5.addRow(['Metric', 'Value']);
  sheet5.getRow(1).font = { bold: true };
  sheet5.addRow(['Total Test Cases', summary.totalTests]);
  sheet5.addRow(['Passed', summary.passed]);
  sheet5.addRow(['Failed', summary.failed]);
  sheet5.addRow(['Skipped', summary.skipped]);
  sheet5.addRow(['Blocked', summary.blocked]);
  sheet5.addRow(['Pass Rate', summary.passRate]);
  sheet5.addRow(['Duration (ms)', summary.executionDurationMs]);

  // Sheet 6: Defect Summary
  const sheet6 = workbook.addWorksheet('Defect Summary');
  sheet6.columns = [
    { header: 'Test ID', key: 'testId', width: 15 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Test Name', key: 'testName', width: 40 },
    { header: 'Failure Reason', key: 'actualResult', width: 50 }
  ];
  sheet6.getRow(1).font = { bold: true };
  results.filter(t => t.status === 'Failed').forEach(t => sheet6.addRow(t));

  await workbook.xlsx.writeFile(path.join(outputFolder, 'Automation_Test_Report.xlsx'));

  // Create individual helper spreadsheets
  const passedBook = new ExcelJS.Workbook();
  const passedSheet = passedBook.addWorksheet('Passed Tests');
  passedSheet.columns = sheet1.columns;
  results.filter(t => t.status === 'Passed').forEach(t => passedSheet.addRow(t));
  await passedBook.xlsx.writeFile(path.join(outputFolder, 'Passed_Test_Cases.xlsx'));

  const failedBook = new ExcelJS.Workbook();
  const failedSheet = failedBook.addWorksheet('Failed Tests');
  failedSheet.columns = sheet1.columns;
  results.filter(t => t.status === 'Failed').forEach(t => failedSheet.addRow(t));
  await failedBook.xlsx.writeFile(path.join(outputFolder, 'Failed_Test_Cases.xlsx'));

  const summaryBook = new ExcelJS.Workbook();
  const summarySheet = summaryBook.addWorksheet('Summary');
  summarySheet.addRow(['Total', 'Passed', 'Failed', 'Skipped', 'Pass Rate']);
  summarySheet.addRow([summary.totalTests, summary.passed, summary.failed, summary.skipped, summary.passRate]);
  await summaryBook.xlsx.writeFile(path.join(outputFolder, 'Summary_Report.xlsx'));
}

function generateHTMLReports(results, outputFolder, summary) {
  const chartData = results.reduce((acc, t) => {
    acc[t.module] = acc[t.module] || { passed: 0, total: 0 };
    acc[t.module].total++;
    if (t.status === 'Passed') acc[t.module].passed++;
    return acc;
  }, {});

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
    <title>E2E Execution Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Inter', sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
      .container { max-width: 1200px; margin: 0 auto; }
      header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
      .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
      .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
      .card-title { font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 10px; }
      .card-value { font-size: 32px; font-weight: 700; color: #0f172a; }
      table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
      th, td { padding: 16px 20px; text-align: left; border-bottom: 1px solid #e2e8f0; }
      th { background-color: #f1f5f9; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; color: #475569; }
      .badge { padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
      .badge-passed { background-color: #d1fae5; color: #065f46; }
      .badge-failed { background-color: #fee2e2; color: #991b1b; }
      .badge-skipped { background-color: #fef3c7; color: #92400e; }
      .badge-blocked { background-color: #e2e8f0; color: #475569; }
      tr:hover { background-color: #f8fafc; }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <h1 style="margin: 0; font-size: 28px;">Web Selenium E2E Automation Report</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.8;">Live Deployment E2E Verification Report</p>
      </header>
      <div class="metrics">
        <div class="card">
          <div class="card-title">Total Tests</div>
          <div class="card-value">${summary.totalTests}</div>
        </div>
        <div class="card">
          <div class="card-title">Passed</div>
          <div class="card-value" style="color: #10b981;">${summary.passed}</div>
        </div>
        <div class="card">
          <div class="card-title">Failed</div>
          <div class="card-value" style="color: #ef4444;">${summary.failed}</div>
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
# Live GitHub Pages E2E Execution Summary

**Execution Date:** ${new Date().toUTCString()}
**Browser:** Chrome Headless
**Platform:** GitHub Actions

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

module.exports = { generateReports };
