const { test, expect } = require('@playwright/test');

test('buy iPhone 13 pro', async ({ page }) => {
  const email = 'nkapasi@test.com';
  const password = '!Test1234';
  const productName = 'iphone 13 pro';

  await page.goto('https://rahulshettyacademy.com/client');
  await page.getByPlaceholder('email@example.com').fill(email);
  await page.getByPlaceholder('enter your passsword').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForLoadState('networkidle');

  const product = page.locator('.card-body').filter({ hasText: productName });
  await expect(product).toHaveCount(1);
  await product.getByRole('button', { name: /Add To Cart/i }).click();

  await page.locator("button[routerlink='/dashboard/cart']").click();
  await expect(page.getByRole('heading', { name: productName, exact: true })).toBeVisible();
  await page.getByText('Checkout', { exact: true }).click();

  await page.getByPlaceholder('Select Country').pressSequentially('ind');
  const countryOptions = page.locator('.ta-results button');
  await countryOptions.first().waitFor();
  await countryOptions.filter({ hasText: /^ India$/ }).click();

  await expect(page.locator("input[type='text']").nth(4)).toHaveValue(email);
  await page.locator('input').nth(2).fill('123');
  await page.locator('input').nth(3).fill('nkapasi');
  await page.getByText('Place Order', { exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Thankyou for the order.' })).toBeVisible();
  await expect(page.getByText(productName, { exact: true })).toBeVisible();
});