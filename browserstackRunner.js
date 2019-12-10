const createTestCafe = require('testcafe');
let testcafe = null;

createTestCafe('localhost', 1337, 1338)
    .then(tc => {
        testcafe = tc;
        const runner = testcafe.createRunner();

        process.env.BROWSERSTACK_USERNAME = '<MY_BROWSERSTACK_USERNAME>';
        process.env.BROWSERSTACK_ACCESS_KEY = '<MY_BROWSERSTACK_ACCESS_KEY>';

        //We need this for taking screenshots of elements
        process.env.BROWSERSTACK_USE_AUTOMATE = '1';

        return runner
            .src(['tests/**/*.spec.ts'])
            .browsers(['browserstack:chrome@78.0:Windows 10'])
            .reporter(['spec', {
                name: 'html',
                output: 'reports/report.html'
            }])
            .run();
    })
    .then(failedCount => {
        console.log('Tests failed: ' + failedCount);
        testcafe.close();
        if (failedCount > 0) {
            process.exit(1);
        }
    });
