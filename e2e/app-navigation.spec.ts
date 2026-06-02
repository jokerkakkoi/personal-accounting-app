import { test, expect } from '@playwright/test';

test.describe('Antigravity Ledger Navigation & Flow Tests', () => {
  test('Should guide user through welcome onboarding to the homepage and open transaction page', async ({ page }) => {
    // 1. Visit the app root (should redirect to welcome since onboarding hasn't been completed)
    await page.goto('/');
    await expect(page).toHaveURL(/\/welcome/);

    // 2. Check Welcome screen 1 contents
    await expect(page.locator('text=Antigravity Ledger')).toBeVisible();
    await expect(page.locator('text=简单、智能、本地化')).toBeVisible();

    // 3. Click '下一步' (Next) to view features list
    await page.click('text=下一步');
    await expect(page.locator('text=探索强大功能')).toBeVisible();
    await expect(page.locator('text=轻松记账')).toBeVisible();
    await expect(page.locator('text=AI 智能分类')).toBeVisible();
    await expect(page.locator('text=预算与报表')).toBeVisible();

    // 4. Click '开始使用' (Get Started) to complete onboarding and load homepage
    await page.click('text=开始使用');
    await expect(page).toHaveURL(/\/$/);

    // 5. Verify homepage has loaded with monthly summary statistics
    await expect(page.locator('text=明细记录')).toBeVisible();
    await expect(page.locator('text=本月结余')).toBeVisible();

    // 6. Check that navigation layouts are present
    const homeTab = page.getByRole('button', { name: '首页', exact: true });
    const budgetTab = page.getByRole('button', { name: '预算', exact: true });
    const reportTab = page.getByRole('button', { name: '报表', exact: true });
    const settingsTab = page.getByRole('button', { name: '我的', exact: true });
    
    await expect(homeTab).toBeVisible();
    await expect(budgetTab).toBeVisible();
    await expect(reportTab).toBeVisible();
    await expect(settingsTab).toBeVisible();

    // 7. Click Centered Floating Action Button (FAB) to record a new transaction
    await page.click('button[aria-label="新建交易"]');
    await expect(page).toHaveURL(/\/transaction\/new/);

    // 8. Verify the transaction form page loaded correctly
    await expect(page.locator('text=记一笔')).toBeVisible();
    await expect(page.locator('text=选择分类')).toBeVisible();
    await expect(page.locator('text=交易备注')).toBeVisible();
    
    // Check that custom Numpad buttons exist (at least buttons 0-9)
    await expect(page.locator('button:has-text("7")')).toBeVisible();
    await expect(page.locator('button:has-text("8")')).toBeVisible();
    await expect(page.locator('button:has-text("9")')).toBeVisible();
  });

  test('Should allow user to skip onboarding directly to home page', async ({ page }) => {
    // 1. Visit root, should redirect to /welcome
    await page.goto('/');
    await expect(page).toHaveURL(/\/welcome/);

    // 2. Click the '跳过' (Skip) button
    await page.click('text=跳过');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('text=明细记录')).toBeVisible();
  });
});
