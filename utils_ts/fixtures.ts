const {request} = require("@playwright/test");
const base = require("@playwright/test");
const { APIUtils } = require('../utils/APiUtils.js');
const loginPayLoad = { userEmail: "nkapasi@test.com", userPassword: "!Test1234" };
const orderPayLoad = {orders:[{country:"India",productOrderedId:"6a9e19e8e7cd69710fc4e8d6"}]};


export const customtest = base.test.extend(
    {
        authenticatedPage: async ({ browser }, use) => {
            const context = await browser.newContext();
            const page = await context.newPage();
            await page.goto('https://rahulshettyacademy.com/client');
            await page.getByPlaceholder('email@example.com').fill("nkapasi@test.com");
            await page.getByPlaceholder('enter your passsword').fill("!Test1234");
            await page.getByRole('button', { name: 'Login' }).click();
            await page.waitForLoadState('networkidle');
            await use(page)
        
        },
        createOrders: async ({}, use) => {
            const apiContext = await request.newContext();
            const apiUtils = new APIUtils(apiContext, loginPayLoad);
            const response = await apiUtils.createOrder(orderPayLoad);
            await use(response);
            await context.close();
            
        },
        testdatafororder: { 
            productName : 'NIKE ORIGINAL'
        }
    })