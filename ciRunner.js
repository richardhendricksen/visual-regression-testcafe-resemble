const createTestCafe = require('testcafe');
let testcafe = null;

createTestCafe('localhost', 1337, 1338)
  .then(tc => {
    testcafe = tc;
    const runner = testcafe.createRunner();

    return runner
      .src(['tests/**/*.spec.ts'])
      .browsers(['chrome:headless'])
      .reporter(['spec', {
        name: 'html',
        output: 'reports/report.html'
      }])
      .run();
  })
  .then(failedCount => {
    console.log('Tests failed: ' + failedCount);
    testcafe.close();
  });
