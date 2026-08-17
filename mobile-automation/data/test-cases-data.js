const categories = {
  'Authentication': { prefix: 'TC_MOB_AUTH_', count: 40, priority: ['Critical', 'High'] },
  'Authorization': { prefix: 'TC_MOB_AUTHZ_', count: 30, priority: ['Critical', 'High'] },
  'Registration': { prefix: 'TC_MOB_REG_', count: 20, priority: ['High'] },
  'Profile Management': { prefix: 'TC_MOB_PROF_', count: 20, priority: ['Medium'] },
  'Navigation': { prefix: 'TC_MOB_NAV_', count: 30, priority: ['Medium', 'Low'] },
  'Dashboard': { prefix: 'TC_MOB_DASH_', count: 20, priority: ['High'] },
  'Forms': { prefix: 'TC_MOB_FORM_', count: 40, priority: ['Medium'] },
  'CRUD Operations': { prefix: 'TC_MOB_CRUD_', count: 40, priority: ['High', 'Medium'] },
  'Search': { prefix: 'TC_MOB_SRCH_', count: 20, priority: ['Medium'] },
  'Filters': { prefix: 'TC_MOB_FILT_', count: 20, priority: ['Medium'] },
  'Input Validation': { prefix: 'TC_MOB_VAL_', count: 40, priority: ['High', 'Medium'] },
  'Error Handling': { prefix: 'TC_MOB_ERR_', count: 20, priority: ['Medium'] },
  'Session Management': { prefix: 'TC_MOB_SESS_', count: 20, priority: ['High'] },
  'Notifications': { prefix: 'TC_MOB_NOTIF_', count: 20, priority: ['Medium'] },
  'File Upload': { prefix: 'TC_MOB_FILE_', count: 20, priority: ['Low'] },
  'Offline Handling': { prefix: 'TC_MOB_OFF_', count: 10, priority: ['High'] },
  'Accessibility': { prefix: 'TC_MOB_ACC_', count: 20, priority: ['Low'] },
  'Responsive UI': { prefix: 'TC_MOB_RESP_', count: 10, priority: ['Low'] },
  'Performance Smoke Tests': { prefix: 'TC_MOB_PERF_', count: 20, priority: ['High'] },
  'Regression Suite': { prefix: 'TC_MOB_REGRESS_', count: 50, priority: ['High', 'Medium', 'Low'] }
};

const generateMobileTestCases = () => {
  const list = [];
  for (const [moduleName, config] of Object.entries(categories)) {
    for (let i = 1; i <= config.count; i++) {
      const paddedId = String(i).padStart(3, '0');
      const testId = `${config.prefix}${paddedId}`;
      const priority = config.priority[i % config.priority.length];
      
      let testName = `Mobile ${moduleName} Verification ${i}`;
      let expectedResult = `Mobile app processes ${moduleName.toLowerCase()} step ${i} correctly.`;
      let steps = [
        `1. Start Android App on emulator`,
        `2. Tap on ${moduleName} component and input standard mock data for item ${i}`,
        `3. Validate native ui components and alert notifications`
      ];

      if (moduleName === 'Authentication') {
        if (i === 1) {
          testName = 'Valid Login on Mobile App';
          expectedResult = 'User should successfully authenticate and view teacher dashboard.';
        } else if (i === 2) {
          testName = 'Expired Session Re-Authentication';
          expectedResult = 'Application redirects to login flow showing session expired alert.';
        }
      } else if (moduleName === 'Offline Handling') {
        testName = `Simulate Network Disconnection - ${i}`;
        expectedResult = 'App displays offline banner and serves cached profile/course data.';
      }

      list.push({
        testId,
        module: moduleName,
        testName,
        priority,
        preconditions: 'App is installed on Android Emulator, device is online.',
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
  mobileTestCases: generateMobileTestCases()
};
