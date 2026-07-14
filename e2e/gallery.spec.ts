import { test, expect, type Page } from '@playwright/test';

const GALLERY_IMAGE_COUNT = 4;

function gallery(page: Page) {
  return page.getByRole('region', { name: /Immagini di/ });
}

// Attende l'idratazione React prima di ogni interazione: i controlli
// del carousel esistono nel markup SSR ma rispondono solo dopo il mount.
async function openPdp(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(gallery(page)).toHaveAttribute('data-hydrated', 'true');
}

function prevButton(page: Page) {
  return page.getByRole('button', { name: 'Immagine precedente' });
}

function nextButton(page: Page) {
  return page.getByRole('button', { name: 'Immagine successiva' });
}

test.describe('ProductGallery — struttura', () => {
  test('la gallery precede le informazioni prodotto', async ({ page }) => {
    await openPdp(page);

    const isBefore = await page.evaluate(() => {
      const region = document.querySelector('section[aria-label^="Immagini di"]');
      const heading = document.querySelector('main h1');
      if (!region || !heading) return false;
      return Boolean(
        region.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING
      );
    });

    expect(isBefore).toBe(true);
  });

  test('renderizza tutte le immagini una sola volta', async ({ page }) => {
    await openPdp(page);

    await expect(gallery(page).getByRole('listitem')).toHaveCount(GALLERY_IMAGE_COUNT);
    await expect(
      gallery(page).getByRole('button', { name: /^Apri immagine/ })
    ).toHaveCount(GALLERY_IMAGE_COUNT);
  });

  test("l'attivazione del trigger apre la lightbox senza errori", async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await openPdp(page);
    await gallery(page).getByRole('button', { name: /^Apri immagine 1/ }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });
});

test.describe('ProductGallery — carousel mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('controlli visibili, precedente disabilitato sulla prima immagine', async ({
    page,
  }) => {
    await openPdp(page);

    await expect(prevButton(page)).toBeVisible();
    await expect(prevButton(page)).toBeDisabled();
    await expect(nextButton(page)).toBeEnabled();
  });

  test('il contatore cambia dopo navigazione e non esiste loop', async ({ page }) => {
    await openPdp(page);

    const counter = gallery(page).locator('[aria-hidden="true"]', {
      hasText: `/ ${GALLERY_IMAGE_COUNT}`,
    });
    await expect(counter).toHaveText(`1 / ${GALLERY_IMAGE_COUNT}`);

    await nextButton(page).click();
    await expect(counter).toHaveText(`2 / ${GALLERY_IMAGE_COUNT}`);

    for (let i = 2; i < GALLERY_IMAGE_COUNT; i += 1) {
      await nextButton(page).click();
    }
    await expect(counter).toHaveText(`${GALLERY_IMAGE_COUNT} / ${GALLERY_IMAGE_COUNT}`);
    await expect(nextButton(page)).toBeDisabled();

    await prevButton(page).click();
    await expect(counter).toHaveText(`3 / ${GALLERY_IMAGE_COUNT}`);
  });

  test('precedente/successiva non spostano verticalmente la pagina', async ({ page }) => {
    await openPdp(page);

    const before = await page.evaluate(() => window.scrollY);
    await nextButton(page).click();
    await expect(
      gallery(page).locator('[aria-hidden="true"]', { hasText: '2 /' })
    ).toBeVisible();
    const after = await page.evaluate(() => window.scrollY);

    expect(after).toBe(before);
  });
});

test.describe('ProductGallery — integrità responsive', () => {
  const VIEWPORTS = [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 767, height: 1024 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ];

  for (const viewport of VIEWPORTS) {
    test(`nessun overflow orizzontale a ${viewport.width}×${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openPdp(page);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test('landscape 844×390: controlli lightbox dentro la viewport', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await openPdp(page);
    await gallery(page).getByRole('button', { name: /^Apri immagine 1 / }).click();

    const dialogLocator = page.getByRole('dialog');
    await expect(dialogLocator).toBeVisible();

    for (const name of [
      'Chiudi galleria',
      'Aumenta zoom',
      'Riduci zoom',
      'Immagine precedente',
      'Immagine successiva',
    ]) {
      const box = await dialogLocator.getByRole('button', { name }).boundingBox();
      expect(box, name).not.toBeNull();
      expect(box!.y, name).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height, name).toBeLessThanOrEqual(390);
      expect(box!.x, name).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, name).toBeLessThanOrEqual(844);
    }
  });
});

test.describe('ProductGallery — griglia desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('controlli carousel nascosti da 768px', async ({ page }) => {
    await openPdp(page);

    await expect(prevButton(page)).toBeHidden();
    await expect(nextButton(page)).toBeHidden();
  });

  test('la lista usa due colonne', async ({ page }) => {
    await openPdp(page);

    const columns = await gallery(page)
      .getByRole('list')
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);

    expect(columns).toBe(2);
  });

  test('con raccolta pari nessuna cella occupa entrambe le colonne', async ({ page }) => {
    await openPdp(page);

    const spans = await gallery(page)
      .getByRole('listitem')
      .evaluateAll((items) =>
        items.map((el) => getComputedStyle(el).gridColumn.replace(/\s/g, ''))
      );

    for (const span of spans) {
      expect(span).not.toBe('1/-1');
    }
  });
});
