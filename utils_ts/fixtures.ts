const base = require('@playwright/test');
const {APiUtils} = require('./APiUtils.js');
const {request} = require('@playwright/test');
import type { Browser, Page } from '@playwright/test';

const loginPayLoad = { userEmail: 'nkapasi@test.com', userPassword: '!Test1234' };
const orderPayLoad = {
  orders: [{ country: 'India', productOrderedId: '6960eac0c941646b7a8b3e68' }]};

exports.customtest = base.test.extend({
  authenticatedPage: async ({ browser }: { browser: Browser }, use: (page: Page) => Promise<void>) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('https://rahulshettyacademy.com/client');
    await page.locator('#userEmail').fill('nkapasi@test.com');
    await page.locator('#userPassword').fill('!Test1234');
    await page.locator("[value='Login']").click();
    await page.waitForLoadState('networkidle');

    await use(page);
    //tear down
    await context.close();





  },

  createOrder : async({}, use: (response: any) => Promise<void>)=>
  {
   const apiContext = await request.newContext();
   const apiUtils = new APiUtils(apiContext,loginPayLoad);
   const response =  await apiUtils.createOrder(orderPayLoad);
   await use(response);
   await apiContext.dispose();

  },

  testDataForOrder : {

    productName : 'ADIDAS ORIGINAL'
  }
});








