const { test, expect } = require("@playwright/test");
test.describe.configure({mode: 'serial'});
test('@Security Test intercept', async  ({page})=> 
    {
    const email = 'nkapasi@test.com';
    const password = '!Test1234';
    const productName = 'iphone 13 pro';
    const products = page.locator(".card-body");
    await page.goto("https://rahulshettyacademy.com/client");
    await page.locator("#userEmail").fill("nkapasi@test.com");
    await page.locator("#userPassword").fill("!Test1234");
    await page.locator("[value='Login']").click();
    await page.waitForLoadState('networkidle');
    await page.locator(".card-body b").first().waitFor();
    //to prevent loading  any images
     //page.route('**/*.{jpeg,jpg,png,gif,svg}', route => route.abort());

    await page.locator("button[routerlink*='myorders']").click();
    

    await page.route("https://rahulshettyacademy.com/api/ecom/order/get-orders-for-customer/=*");
   route => route.continue({url: "https://rahulshettyacademy.com/api/ecom/order/get-orders-for-customer/8888"});
    await page.locator("button:has-text('View')").first().click();
    await expect(page.locator("p").last()).toHaveText("You are not authorized to view this order");

    }
);