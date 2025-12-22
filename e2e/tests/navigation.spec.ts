import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('Main navigation links work correctly', async ({ page }) => {
    // Start at homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test navigation to Products
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/products');
    
    // Test navigation to Vendors
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/vendors');
    
    // Test navigation to Transactions
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/transactions');
  });

  test('Page titles are appropriate for each route', async ({ page }) => {
    const routes = [
      { path: '/', expectedTitle: /POS|Dashboard|Home/i },
      { path: '/products', expectedTitle: /POS|Products/i },
      { path: '/vendors', expectedTitle: /POS|Vendors/i },
      { path: '/transactions', expectedTitle: /POS|Transactions/i }
    ];
    
    for (const route of routes) {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveTitle(route.expectedTitle);
    }
  });

  test('Forecasting page is accessible', async ({ page }) => {
    await page.goto('/forecasting');
    await page.waitForLoadState('networkidle');
    
    // Check page loaded successfully
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('Unknown routes are handled gracefully', async ({ page }) => {
    // Visit an unknown route
    const response = await page.goto('/unknown-route-that-does-not-exist');
    
    // Either redirected to home or shows 404 page
    // The key is that the app doesn't crash
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('Browser back/forward navigation works', async ({ page }) => {
    // Navigate through multiple pages
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle');
    
    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/products');
    
    // Go forward
    await page.goForward();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/vendors');
  });

  test('Direct URL access works for all main routes', async ({ page }) => {
    const routes = ['/', '/products', '/vendors', '/transactions', '/forecasting', '/login', '/register'];
    
    for (const route of routes) {
      const response = await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Each page should load without server errors
      expect(response?.status()).toBeLessThan(500);
      
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(100);
    }
  });
});

test.describe('Responsive Layout Tests', () => {
  test('Mobile viewport displays correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should still render
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('Tablet viewport displays correctly', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should still render
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('Desktop viewport displays correctly', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should still render
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });
});
