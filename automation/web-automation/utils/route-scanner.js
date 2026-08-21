const fs = require('fs');
const path = require('path');

function scanRoutesAndForms() {
  const testCases = [];
  const projectRoot = path.join(__dirname, '../../..');
  
  const routesFile = path.join(projectRoot, 'website/src/routes/AppRoutes.jsx');
  if (!fs.existsSync(routesFile)) {
    console.warn('AppRoutes.jsx not found, returning fallback static test cases.');
    return [];
  }

  const routesContent = fs.readFileSync(routesFile, 'utf8');
  
  // Regex to match routes: path="/something"
  const routeRegex = /path=["']([^"']+)["']/g;
  let match;
  const routesList = new Set();
  
  while ((match = routeRegex.exec(routesContent)) !== null) {
    const routePath = match[1];
    if (routePath && !routePath.includes(':')) { // Skip parameter routes for simple smoke testing
      routesList.add(routePath);
    }
  }

  // Fallbacks if regex doesn't match
  if (routesList.size === 0) {
    ['/', '/login', '/signup', '/forgot-password', '/about', '/courses', '/professors', '/events', '/dashboard'].forEach(r => routesList.add(r));
  }

  // Scan public pages to identify inputs, buttons and dynamic forms
  const publicPagesDir = path.join(projectRoot, 'website/src/pages/public');
  const pagesList = ['Login.jsx', 'Signup.jsx', 'ForgotPassword.jsx'];
  
  let testIdCounter = 1;

  // Add route reachability test cases dynamically
  routesList.forEach(route => {
    testCases.push({
      testId: `TC_DYN_NAV_${String(testIdCounter++).padStart(3, '0')}`,
      module: 'Dynamic Navigation',
      testName: `Verify reachability of page route: ${route}`,
      priority: 'High',
      preconditions: 'Application is running and reachable.',
      steps: `1. Launch browser\n2. Navigate to route path: ${route}\n3. Check page title and content load`,
      expectedResult: `Route ${route} should render correct components without throwing console exceptions.`,
      status: 'Pending',
      executionTime: 0
    });
  });

  // Scan files and extract form validations
  pagesList.forEach(pageFile => {
    const filePath = path.join(publicPagesDir, pageFile);
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, 'utf8');
    const moduleName = pageFile.replace('.jsx', '');

    // Check for input tags
    const inputRegex = /<input[^>]+type=["']([^"']+)["']/g;
    const inputTypes = [];
    let inputMatch;
    while ((inputMatch = inputRegex.exec(content)) !== null) {
      inputTypes.push(inputMatch[1]);
    }

    // Check for validation logic checks
    const validations = [];
    if (content.includes('emailRegex') || content.includes('type="email"')) {
      validations.push({
        name: 'Email Format Validation',
        field: 'Email',
        objective: 'Ensure invalid email strings are rejected.'
      });
    }
    if (content.includes('password.length') || content.includes('.length <')) {
      validations.push({
        name: 'Password Length Validation',
        field: 'Password',
        objective: 'Ensure short password entries are rejected by front-end rules.'
      });
    }
    if (content.includes('terms') || content.includes('termsCheckbox')) {
      validations.push({
        name: 'Terms and Conditions Agreement Check',
        field: 'Terms Checkbox',
        objective: 'Ensure user cannot submit registration without checking terms checkbox.'
      });
    }

    // Add form field detection test cases dynamically
    if (inputTypes.length > 0) {
      testCases.push({
        testId: `TC_DYN_FORM_${String(testIdCounter++).padStart(3, '0')}`,
        module: `Dynamic Forms - ${moduleName}`,
        testName: `Verify Form field structure for page: ${moduleName}`,
        priority: 'High',
        preconditions: `User is navigating to ${moduleName} page.`,
        steps: `1. Open browser\n2. Navigate to ${moduleName} module\n3. Locate form inputs\n4. Verify inputs match expected field types: [${inputTypes.join(', ')}]`,
        expectedResult: `All expected form inputs of types [${inputTypes.join(', ')}] are rendered correctly.`,
        status: 'Pending',
        executionTime: 0
      });
    }

    // Add validation rules dynamically discovered from source
    validations.forEach(val => {
      testCases.push({
        testId: `TC_DYN_VAL_${String(testIdCounter++).padStart(3, '0')}`,
        module: `Dynamic Validation - ${moduleName}`,
        testName: `Verify ${val.name} in ${moduleName} form`,
        priority: 'Critical',
        preconditions: `User is filling out the ${moduleName} form.`,
        steps: `1. Navigate to ${moduleName} module\n2. Enter invalid test vector for field: ${val.field}\n3. Submit form\n4. Verify error validation indicator appears`,
        expectedResult: val.objective,
        status: 'Pending',
        executionTime: 0
      });
    });
  });

  return testCases;
}

module.exports = { scanRoutesAndForms };
