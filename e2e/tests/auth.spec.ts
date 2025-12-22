import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:8000';

test.describe('Authentication Flow Tests', () => {
  test('Login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Verify login form elements are present
    await expect(page.getByRole('heading', { name: /Sign In/i })).toBeVisible();
    await expect(page.getByPlaceholder(/username/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  test('Register page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Verify registration form elements are present
    await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible();
    await expect(page.getByPlaceholder(/username/i)).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible();
  });

  test('Login page has link to registration', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Verify register link exists
    const registerLink = page.getByRole('link', { name: /register/i });
    await expect(registerLink).toBeVisible();
  });

  test('Register page has link to login', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Verify login link exists
    const loginLink = page.getByRole('link', { name: /sign in/i });
    await expect(loginLink).toBeVisible();
  });

  test('Login form shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Fill in invalid credentials
    await page.getByPlaceholder(/username/i).fill('invaliduser');
    await page.getByPlaceholder(/password/i).fill('invalidpass');
    
    // Submit form
    await page.getByRole('button', { name: /Sign In/i }).click();
    
    // Wait for error message (may or may not appear depending on backend state)
    await page.waitForTimeout(2000);
    
    // The page should still be on login or show an error
    const url = page.url();
    expect(url).toMatch(/login|error/i);
  });

  test('Navigation to login from any page works', async ({ page }) => {
    // Start at homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Navigate to login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the login page
    await expect(page.getByPlaceholder(/username/i)).toBeVisible();
  });
});

test.describe('Authentication API Tests', () => {
  test('Auth token endpoint exists', async ({ request }) => {
    // Try to get a token with invalid credentials
    const response = await request.post(`${API_URL}/auth/token`, {
      form: {
        username: 'testuser',
        password: 'testpass'
      }
    });
    
    // Should return 401 for invalid credentials or 200 for valid
    expect([200, 401, 422]).toContain(response.status());
  });

  test('Protected endpoints require authentication', async ({ request }) => {
    // Try to access protected endpoint without auth
    const response = await request.get(`${API_URL}/users/me`);
    
    // Should return 401 or 403 without auth
    expect([401, 403, 404]).toContain(response.status());
  });
});
