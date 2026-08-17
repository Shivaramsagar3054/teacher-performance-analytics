const categories = {
  'Authentication': { prefix: 'TC_AUTH_', count: 40, priority: ['High', 'Critical'] },
  'Authorization': { prefix: 'TC_AUTHZ_', count: 40, priority: ['High', 'Critical'] },
  'Navigation': { prefix: 'TC_NAV_', count: 30, priority: ['Medium', 'Low'] },
  'UI Validation': { prefix: 'TC_UI_', count: 50, priority: ['Medium', 'Low'] },
  'Forms': { prefix: 'TC_FORM_', count: 50, priority: ['High', 'Medium'] },
  'CRUD Operations': { prefix: 'TC_CRUD_', count: 50, priority: ['High', 'Medium'] },
  'Input Validation': { prefix: 'TC_VAL_', count: 40, priority: ['High', 'Medium'] },
  'Error Handling': { prefix: 'TC_ERR_', count: 20, priority: ['Medium'] },
  'Session Management': { prefix: 'TC_SESS_', count: 20, priority: ['High', 'Critical'] },
  'File Upload': { prefix: 'TC_FILE_', count: 20, priority: ['Medium'] },
  'Accessibility': { prefix: 'TC_ACC_', count: 20, priority: ['Low'] },
  'Responsive Design': { prefix: 'TC_RESP_', count: 20, priority: ['Low'] },
  'Performance Smoke Tests': { prefix: 'TC_PERF_', count: 20, priority: ['High'] },
  'Regression': { prefix: 'TC_REG_', count: 50, priority: ['High', 'Medium', 'Low'] }
};

const generateTestCases = () => {
  const list = [];
  for (const [moduleName, config] of Object.entries(categories)) {
    for (let i = 1; i <= config.count; i++) {
      const paddedId = String(i).padStart(3, '0');
      const testId = `${config.prefix}${paddedId}`;
      const priority = config.priority[i % config.priority.length];
      
      let testName = `${moduleName} Test Case ${i}`;
      let expectedResult = `System should process ${moduleName.toLowerCase()} step ${i} successfully.`;
      let steps = [
        `1. Navigate to target application module: ${moduleName}`,
        `2. Perform action specific to test case step ${i}`,
        `3. Validate response and state change`
      ];

      // Add realistic name/details based on module
      if (moduleName === 'Authentication') {
        if (i === 1) {
          testName = 'Valid User Login with Email and Password';
          expectedResult = 'User should be successfully logged in and redirected to dashboard.';
        } else if (i === 2) {
          testName = 'User Logout';
          expectedResult = 'User session should end, and user should be redirected to Login Page.';
        } else if (i === 3) {
          testName = 'Login with Invalid Password';
          expectedResult = 'Error message "Invalid credentials" should be shown.';
        } else {
          testName = `Authentication - Login check ${i}`;
        }
      } else if (moduleName === 'Navigation') {
        if (i === 1) {
          testName = 'Navigate to Analytics Section';
          expectedResult = 'Analytics dashboard and performance charts should load.';
        } else if (i === 2) {
          testName = 'Navigate to Profile Management';
          expectedResult = 'Profile details form should load with prefilled information.';
        } else {
          testName = `Navigation - Link verification ${i}`;
        }
      }

      list.push({
        testId,
        module: moduleName,
        testName,
        priority,
        preconditions: `User is on the portal home page. Network status: online.`,
        steps: steps.join('\n'),
        expectedResult,
        actualResult: 'Pending execution',
        status: 'Pending',
        executionTime: 0
      });
    }
  }
  return list;
};

module.exports = {
  testCases: generateTestCases()
};
