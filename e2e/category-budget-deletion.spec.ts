import { test, expect } from '@playwright/test';

test.describe('Category Budget Deletion & Merging', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Visit root and skip onboarding
    await page.goto('/');
    await page.click('text=跳过');
    // Ensure the page and store are ready
    await expect(page.locator('text=明细记录')).toBeVisible();
  });

  test('should merge category budget into fallback category when fallback already has a budget', async ({ page }) => {
    const result = await page.evaluate(() => {
      const store = (window as any).useAppStore;
      
      // Reset to mock data to start clean
      store.getState().resetAllData();

      // Add a custom category
      const catId = store.getState().addCategory({
        name: 'Custom Food',
        icon: '🍔',
        type: 'expense'
      });

      // Find fallback category (which should be 'exp_other' or similar default)
      const state = store.getState();
      const categoryToDelete = state.categories.find((c: any) => c.id === catId);
      const sameTypeCats = state.categories.filter((c: any) => c.type === categoryToDelete.type && c.id !== catId);
      const defaultCategory = sameTypeCats.find((c: any) => c.isDefault)
        || sameTypeCats.find((c: any) => c.id === 'exp_other' || c.id === 'inc_other')
        || sameTypeCats[0];
      const fallbackId = defaultCategory.id;

      // Set budget for the custom category and the fallback category for month "2026-06"
      store.getState().updateCategoryBudget('2026-06', catId, 100);
      store.getState().updateCategoryBudget('2026-06', fallbackId, 50);

      // Verify initial budgets
      const initialBudget = store.getState().budgets.find((b: any) => b.month === '2026-06');
      const initialCatCb = initialBudget.categoryBudgets.find((cb: any) => cb.categoryId === catId);
      const initialFallbackCb = initialBudget.categoryBudgets.find((cb: any) => cb.categoryId === fallbackId);

      const initialOk = initialCatCb.amount === 100 && initialFallbackCb.amount === 50;

      // Delete the category
      store.getState().deleteCategory(catId);

      // Get updated budgets
      const finalBudget = store.getState().budgets.find((b: any) => b.month === '2026-06');
      const finalCatCb = finalBudget.categoryBudgets.find((cb: any) => cb.categoryId === catId);
      const finalFallbackCb = finalBudget.categoryBudgets.find((cb: any) => cb.categoryId === fallbackId);

      return {
        initialOk,
        finalCatCbExists: !!finalCatCb,
        finalFallbackAmount: finalFallbackCb ? finalFallbackCb.amount : null,
      };
    });

    expect(result.initialOk).toBe(true);
    expect(result.finalCatCbExists).toBe(false);
    expect(result.finalFallbackAmount).toBe(150);
  });

  test('should reassign category budget to fallback category when fallback has no budget', async ({ page }) => {
    const result = await page.evaluate(() => {
      const store = (window as any).useAppStore;
      
      // Reset to mock data to start clean
      store.getState().resetAllData();

      // Add a custom category
      const catId = store.getState().addCategory({
        name: 'Custom Leisure',
        icon: '🎮',
        type: 'expense'
      });

      // Find fallback category
      const state = store.getState();
      const categoryToDelete = state.categories.find((c: any) => c.id === catId);
      const sameTypeCats = state.categories.filter((c: any) => c.type === categoryToDelete.type && c.id !== catId);
      const defaultCategory = sameTypeCats.find((c: any) => c.isDefault)
        || sameTypeCats.find((c: any) => c.id === 'exp_other' || c.id === 'inc_other')
        || sameTypeCats[0];
      const fallbackId = defaultCategory.id;

      // Ensure fallback has no budget for month "2026-06"
      store.getState().deleteCategoryBudget('2026-06', fallbackId);

      // Set budget for the custom category
      store.getState().updateCategoryBudget('2026-06', catId, 200);

      // Verify initial budgets
      const initialBudget = store.getState().budgets.find((b: any) => b.month === '2026-06');
      const initialCatCb = initialBudget.categoryBudgets.find((cb: any) => cb.categoryId === catId);
      const initialFallbackCb = initialBudget.categoryBudgets.find((cb: any) => cb.categoryId === fallbackId);

      const initialOk = initialCatCb.amount === 200 && !initialFallbackCb;

      // Delete the category
      store.getState().deleteCategory(catId);

      // Get updated budgets
      const finalBudget = store.getState().budgets.find((b: any) => b.month === '2026-06');
      const finalCatCb = finalBudget.categoryBudgets.find((cb: any) => cb.categoryId === catId);
      const finalFallbackCb = finalBudget.categoryBudgets.find((cb: any) => cb.categoryId === fallbackId);

      return {
        initialOk,
        finalCatCbExists: !!finalCatCb,
        finalFallbackAmount: finalFallbackCb ? finalFallbackCb.amount : null,
      };
    });

    expect(result.initialOk).toBe(true);
    expect(result.finalCatCbExists).toBe(false);
    expect(result.finalFallbackAmount).toBe(200);
  });
});
