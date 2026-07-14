import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TOTAL = 4;

function gallery(page: Page) {
  return page.getByRole('region', { name: /Immagini di/ });
}

function dialog(page: Page) {
  return page.getByRole('dialog');
}

function closeButton(page: Page) {
  return dialog(page).getByRole('button', { name: 'Chiudi galleria' });
}

function prevButton(page: Page) {
  return dialog(page).getByRole('button', { name: 'Immagine precedente' });
}

function nextButton(page: Page) {
  return dialog(page).getByRole('button', { name: 'Immagine successiva' });
}

function counter(page: Page) {
  return dialog(page).locator('[aria-hidden="true"]', { hasText: `/ ${TOTAL}` });
}

async function openPdp(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(gallery(page)).toHaveAttribute('data-hydrated', 'true');
}

async function openLightboxAt(page: Page, index: number) {
  await gallery(page)
    .getByRole('button', { name: new RegExp(`^Apri immagine ${index + 1} `) })
    .click();
  await expect(dialog(page)).toBeVisible();
}

test.describe('Lightbox — apertura e chiusura', () => {
  test('click sul trigger apre il dialog all’indice corretto', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await openPdp(page);
    await openLightboxAt(page, 1);

    await expect(counter(page)).toHaveText(`2 / ${TOTAL}`);
    await expect(dialog(page).locator('img')).toHaveAttribute('src', /02-zoom\.jpg$/);
    expect(pageErrors).toHaveLength(0);
  });

  test('focus iniziale sul pulsante chiudi', async ({ page }) => {
    await openPdp(page);
    await openLightboxAt(page, 0);

    await expect(closeButton(page)).toBeFocused();
  });

  test('pulsante chiudi: dialog chiuso e focus return al trigger', async ({ page }) => {
    await openPdp(page);
    await openLightboxAt(page, 2);

    await closeButton(page).click();

    await expect(dialog(page)).toBeHidden();
    await expect(
      gallery(page).getByRole('button', { name: /^Apri immagine 3 / })
    ).toBeFocused();
  });

  test('Escape chiude e riporta il focus al trigger di origine', async ({ page }) => {
    await openPdp(page);
    await openLightboxAt(page, 0);

    await page.keyboard.press('Escape');

    await expect(dialog(page)).toBeHidden();
    await expect(
      gallery(page).getByRole('button', { name: /^Apri immagine 1 / })
    ).toBeFocused();
  });

  test('focus return al trigger originale anche dopo navigazione interna', async ({
    page,
  }) => {
    await openPdp(page);
    await openLightboxAt(page, 0);

    await nextButton(page).click();
    await expect(counter(page)).toHaveText(`2 / ${TOTAL}`);
    await page.keyboard.press('Escape');

    await expect(
      gallery(page).getByRole('button', { name: /^Apri immagine 1 / })
    ).toBeFocused();
  });

  test('click sul backdrop chiude; click sull’immagine no', async ({ page }) => {
    await openPdp(page);
    await openLightboxAt(page, 0);

    await dialog(page).locator('img').click();
    await expect(dialog(page)).toBeVisible();

    // Angolo in alto a sinistra: area vuota del dialog (backdrop).
    await page.mouse.click(8, 300);
    await expect(dialog(page)).toBeHidden();
    await expect(
      gallery(page).getByRole('button', { name: /^Apri immagine 1 / })
    ).toBeFocused();
  });

  test('un drag sul backdrop non chiude', async ({ page }) => {
    await openPdp(page);
    await openLightboxAt(page, 0);

    await page.mouse.move(8, 300);
    await page.mouse.down();
    await page.mouse.move(60, 340, { steps: 4 });
    await page.mouse.up();

    await expect(dialog(page)).toBeVisible();
  });
});

test.describe('Lightbox — navigazione', () => {
  test('pulsanti e stati disabled agli estremi, nessun loop', async ({ page }) => {
    await openPdp(page);
    await openLightboxAt(page, 0);

    await expect(prevButton(page)).toBeDisabled();
    await expect(nextButton(page)).toBeEnabled();

    for (let i = 1; i < TOTAL; i += 1) {
      await nextButton(page).click();
      await expect(counter(page)).toHaveText(`${i + 1} / ${TOTAL}`);
    }
    await expect(nextButton(page)).toBeDisabled();

    await prevButton(page).click();
    await expect(counter(page)).toHaveText(`3 / ${TOTAL}`);
  });

  test('ArrowRight/ArrowLeft e Home/End', async ({ page }) => {
    await openPdp(page);
    await openLightboxAt(page, 0);

    await page.keyboard.press('ArrowRight');
    await expect(counter(page)).toHaveText(`2 / ${TOTAL}`);

    await page.keyboard.press('ArrowLeft');
    await expect(counter(page)).toHaveText(`1 / ${TOTAL}`);

    await page.keyboard.press('End');
    await expect(counter(page)).toHaveText(`${TOTAL} / ${TOTAL}`);

    await page.keyboard.press('Home');
    await expect(counter(page)).toHaveText(`1 / ${TOTAL}`);

    // Estremo: ArrowLeft sulla prima immagine non cambia nulla.
    await page.keyboard.press('ArrowLeft');
    await expect(counter(page)).toHaveText(`1 / ${TOTAL}`);
  });

  test('Tab e Shift+Tab restano nel dialog (modalità modale nativa)', async ({ page }) => {
    await openPdp(page);
    await openLightboxAt(page, 1);

    // La modalità modale nativa rende inerte la pagina sottostante: il
    // focus non deve mai raggiungere un elemento interattivo fuori dal
    // dialog (body/html sono ammessi durante il passaggio al browser chrome).
    const focusEscaped = () =>
      page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body || el === document.documentElement) return false;
        if (el.tagName === 'DIALOG') return false;
        return el.closest('dialog') === null;
      });

    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      expect(await focusEscaped()).toBe(false);
    }

    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Shift+Tab');
      expect(await focusEscaped()).toBe(false);
    }
  });
});

test.describe('Lightbox — scroll lock', () => {
  test('la pagina non scorre sotto il dialog e la posizione viene ripristinata', async ({
    page,
  }) => {
    await openPdp(page);

    // Posizione non zero che rende il trigger 3 completamente visibile:
    // il focus da click su un elemento parzialmente visibile farebbe
    // scorrere la pagina prima dell'apertura (comportamento nativo).
    const trigger3 = gallery(page).getByRole('button', { name: /^Apri immagine 3 / });
    const offset = await trigger3.evaluate(
      (el) => Math.round(el.getBoundingClientRect().top + window.scrollY) - 12
    );
    expect(offset).toBeGreaterThan(0);

    await page.evaluate((y) => window.scrollTo(0, y), offset);
    await expect
      .poll(async () => page.evaluate(() => window.scrollY))
      .toBe(offset);

    await openLightboxAt(page, 2);

    // Wheel con lightbox aperta: la pagina sottostante non deve scorrere.
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.scrollY)).toBe(offset);

    await closeButton(page).click();
    await expect(dialog(page)).toBeHidden();

    await expect
      .poll(async () =>
        page.evaluate((y) => Math.abs(window.scrollY - y), offset)
      )
      .toBeLessThanOrEqual(2);
  });
});

test.describe('Lightbox — immagini e prefetch', () => {
  test('nessuna richiesta zoom prima dell’apertura; solo corrente e adiacenti dopo', async ({
    page,
  }) => {
    const zoomRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('-zoom')) zoomRequests.push(url);
    });

    await openPdp(page);
    await page.waitForTimeout(500);
    expect(zoomRequests).toHaveLength(0);

    await openLightboxAt(page, 0);
    await expect(dialog(page).locator('img')).toHaveAttribute('src', /01-zoom\.jpg$/);

    // Attende corrente + prefetch dell'unica adiacente (index 1).
    await expect
      .poll(() => zoomRequests.filter((u) => u.includes('02-zoom')).length)
      .toBeGreaterThan(0);

    const requested = new Set(
      zoomRequests.map((u) => u.match(/\d\d-zoom/)?.[0] ?? u)
    );
    expect(requested).toEqual(new Set(['01-zoom', '02-zoom']));
    expect(zoomRequests.every((u) => !u.includes('03-zoom'))).toBe(true);
  });

  test('errore immagine: fallback accessibile e navigazione ancora utilizzabile', async ({
    page,
  }) => {
    await page.route('**/02-zoom.jpg', (route) => route.abort());

    await openPdp(page);
    await openLightboxAt(page, 0);
    await nextButton(page).click();

    await expect(dialog(page).getByText('Immagine non disponibile')).toBeVisible();
    await expect(counter(page)).toHaveText(`2 / ${TOTAL}`);

    await nextButton(page).click();
    await expect(counter(page)).toHaveText(`3 / ${TOTAL}`);
    await expect(dialog(page).locator('img')).toHaveAttribute('src', /03-zoom\.jpg$/);
  });
});

test.describe('Lightbox — stress lifecycle', () => {
  test('aperture e chiusure ripetute: stato, body e focus coerenti', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await openPdp(page);
    const initialBodyStyle = await page.evaluate(
      () => document.body.getAttribute('style') ?? ''
    );

    // 1. Apri e chiudi con il pulsante.
    await openLightboxAt(page, 0);
    await closeButton(page).click();
    await expect(dialog(page)).toBeHidden();

    // 2. Riapri rapidamente, naviga, chiudi con Escape.
    await openLightboxAt(page, 1);
    await nextButton(page).click();
    await expect(counter(page)).toHaveText(`3 / ${TOTAL}`);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(
      gallery(page).getByRole('button', { name: /^Apri immagine 2 / })
    ).toBeFocused();

    // 3. Riapri e chiudi dal backdrop.
    await openLightboxAt(page, 0);
    await page.mouse.click(8, 300);
    await expect(dialog(page)).toBeHidden();

    // Dialog smontato, body ripristinato esattamente, nessun errore.
    expect(await page.locator('dialog').count()).toBe(0);
    const finalBodyStyle = await page.evaluate(
      () => document.body.getAttribute('style') ?? ''
    );
    expect(finalBodyStyle).toBe(initialBodyStyle);
    await expect(
      gallery(page).getByRole('button', { name: /^Apri immagine 1 / })
    ).toBeFocused();
    expect(pageErrors).toHaveLength(0);
  });
});

test.describe('Lightbox — audit axe', () => {
  async function expectNoSeriousViolations(page: Page) {
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious'
    );
    expect(
      blocking.map((violation) => `${violation.id}: ${violation.description}`)
    ).toEqual([]);
  }

  test('PDP con lightbox chiusa', async ({ page }) => {
    await openPdp(page);
    await expectNoSeriousViolations(page);
  });

  test('lightbox aperta', async ({ page }) => {
    await openPdp(page);
    await openLightboxAt(page, 0);
    await expectNoSeriousViolations(page);
  });

  test('dopo navigazione a un’altra immagine', async ({ page }) => {
    await openPdp(page);
    await openLightboxAt(page, 0);
    await nextButton(page).click();
    await expect(counter(page)).toHaveText(`2 / ${TOTAL}`);
    await expectNoSeriousViolations(page);
  });

  test('stato errore', async ({ page }) => {
    await page.route('**/01-zoom.jpg', (route) => route.abort());

    await openPdp(page);
    await openLightboxAt(page, 0);
    await expect(dialog(page).getByText('Immagine non disponibile')).toBeVisible();
    await expectNoSeriousViolations(page);
  });
});
