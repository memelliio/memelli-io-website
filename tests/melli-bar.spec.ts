import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'https://key2debtfree.memelli.io';

test('MelliBar: dial command hits phone dial, not Groq fallback', async ({ page }) => {
  let phoneDialCalled = false;
  let groqFallbackCalled = false;

  await page.route('**/api/phone/dial', (route) => {
    phoneDialCalled = true;
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, callSessionId: 'test-session' }) });
  });
  await page.route('**/api/groq/chat', (route) => {
    groqFallbackCalled = true;
    route.continue();
  });

  await page.goto(BASE_URL);
  await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'admin@memelli.com');
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'Admin1234');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshots/01_logged_in.png' });

  // Open contacts module
  await page.locator('[data-module="contacts"], text=Contacts').first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/02_contacts.png' });

  // Select contact
  await page.locator('text=Sarah Smith').first().click({ timeout: 5000 }).catch(() => {});
  await page.screenshot({ path: 'screenshots/03_contact_selected.png' });

  // Voice command: dial her
  await page.evaluate(() => { (window as any).__memelliSend?.('dial her'); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshots/04_after_dial.png' });

  expect(phoneDialCalled, '/api/phone/dial should be called').toBe(true);
  expect(groqFallbackCalled, 'Groq should NOT be called for simple dial command').toBe(false);
});

test('MelliBar: ambiguous query triggers Groq fallback', async ({ page }) => {
  let groqFallbackCalled = false;

  await page.route('**/api/groq/chat', (route) => {
    groqFallbackCalled = true;
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, speak: 'Here is what I found about her dispute...' }) });
  });

  await page.goto(BASE_URL);
  await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'admin@memelli.com');
  await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'Admin1234');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');

  // Issue complex query
  await page.evaluate(() => { (window as any).__memelliSend?.('what should I tell her about her dispute'); });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/05_groq_fallback.png' });

  expect(groqFallbackCalled, 'Groq fallback should fire for ambiguous query').toBe(true);
});
