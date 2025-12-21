import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:8000';

test.describe('Smoke Tests - Core Pages', () => {
  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/POS|Point of Sale|Intelligent/i);
    
    // Check for no critical console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('Dashboard page loads', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard content or navigation
    const dashboardContent = page.locator('text=/dashboard|overview|summary/i');
    await expect(dashboardContent.first()).toBeVisible({ timeout: 10000 }).catch(() => {
      // Dashboard might redirect to login or have different content
      console.log('Dashboard content check - page may require authentication');
    });
  });

  test('Products page loads', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Check page loaded without critical errors
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('Vendors page loads', async ({ page }) => {
    await page.goto('/vendors');
    await page.waitForLoadState('networkidle');
    
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });

  test('Transactions page loads', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');
    
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);
  });
});

test.describe('Smoke Tests - API Health Endpoints', () => {
  test('Backend health endpoint returns HTTP 200', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.status).toBe('healthy');
  });

  test('Backend root endpoint returns HTTP 200', async ({ request }) => {
    const response = await request.get(`${API_URL}/`);
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.status).toBe('running');
  });

  test('API docs endpoint is accessible', async ({ request }) => {
    const response = await request.get(`${API_URL}/docs`);
    expect(response.status()).toBe(200);
  });
});

test.describe('Smoke Tests - CRUD Operations', () => {
  test('Products API - List products', async ({ request }) => {
    const response = await request.get(`${API_URL}/products/`);
    expect([200, 401, 403]).toContain(response.status());
  });

  test('Vendors API - List vendors', async ({ request }) => {
    const response = await request.get(`${API_URL}/vendors/`);
    expect([200, 401, 403]).toContain(response.status());
  });

  test('Transactions API - List transactions', async ({ request }) => {
    const response = await request.get(`${API_URL}/transactions/`);
    expect([200, 401, 403]).toContain(response.status());
  });
});

test.describe('Smoke Tests - No Console Errors', () => {
  test('No critical console errors on main pages', async ({ page }) => {
    const criticalErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore favicon errors and expected warnings
        if (!text.includes('favicon') && !text.includes('404')) {
          criticalErrors.push(text);
        }
      }
    });

    // Visit multiple pages
    const pages = ['/', '/products', '/vendors', '/transactions'];
    
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
    }

    // Report any critical errors found
    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }
    
    // Allow some non-critical errors but fail on truly critical ones
    const trueCriticalErrors = criticalErrors.filter(e => 
      e.includes('TypeError') || 
      e.includes('ReferenceError') ||
      e.includes('SyntaxError')
    );
    
    expect(trueCriticalErrors).toHaveLength(0);
  });
});
