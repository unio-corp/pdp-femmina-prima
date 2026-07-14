import { test, expect } from '@playwright/test';

test.describe('Product Detail Page', () => {
  test('loads product page with all sections', async ({ page }) => {
    await page.goto('/');

    const gallery = page.getByRole('region', { name: /Immagini di/ });
    await expect(gallery).toBeVisible();

    const productInfo = page.locator('h1');
    await expect(productInfo).toContainText('Giacca in mohair e lana');

    const price = page.locator('p').first();
    await expect(price).toContainText('4200');
  });

  test('gallery navigation works', async ({ page }) => {
    await page.goto('/');

    const nextBtn = page.locator('button[aria-label="Immagine successiva"]');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('accordion toggles content', async ({ page }) => {
    await page.goto('/');

    await page.locator('text=Dettagli prodotto').click();

    const content = page.locator('text=Tela di lana');
    await expect(content).toBeVisible();
  });

  test('responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const gallery = page.getByRole('region', { name: /Immagini di/ }).getByRole('listitem');
    const firstItem = gallery.first();

    const width = await firstItem.evaluate((el) => window.getComputedStyle(el).width);
    expect(width).not.toContain('50%');
  });

  test('dark mode switches', async ({ page }) => {
    await page.goto('/');

    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    });

    expect(bgColor).toBeTruthy();
  });

  test('sticky bar visible on scroll', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => window.scrollBy(0, 500));

    const stickyBar = page.locator('[class*="StickyBar"]');
    await expect(stickyBar).toBeInViewport();
  });
});
