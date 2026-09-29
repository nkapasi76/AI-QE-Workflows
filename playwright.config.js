// @ts-check
const { devices } = require('@playwright/test');

/* projects: [
  {
    name: 'chromium',
    use: {
      browserName: 'chromium',
      headless: false,
      screenshot: 'on',
      trace: 'on',//off,on },
      ...devices['iPhone 13 Pro'], 
    }

  },
  {
    name: 'firefox',
    use: {
      browserName: 'firefox',
      headless: false,
      screenshot: 'off',
      trace: 'on',//off,on },
      ignoreHTTPSErrors: true, //ignores SSL certificate errors and proceeds.
      permissions: ['geolocation'],//allow the browser to accept any questions based on tracking locations
    }
  }
] */

const isCI = !!process.env.CI;

const config = {
  testDir: './tests',
  testMatch: '**/*.spec.{js,ts}',

  /* Maximum time one test can run for. */
timeout: 30 * 1000,
  expect: {

    timeout: 5000
  },

  retries: 1, //retries the test once if it fails.

  // open: 'always' serves the report and waits, which would hang CI
  reporter: [["html", { open: isCI ? "never" : "always" }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {

    browserName: 'chromium',
    headless: isCI, //headed locally; CI runners have no display
    screenshot: 'only-on-failure',
    trace: 'on',//off,on
    video: 'only-on-failure', //video is created when the test fails.

  },


};

module.exports = config;