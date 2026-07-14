import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TOTAL = 4;

function gallery(page: Page) {
  return page.getByRole('region', { name: /Immagini di/ });
}

function dialog(page: Page) {
  return page.getByRole('dialog');
}

function surface(page: Page) {
  return dialog(page).locator('[data-zoom-scale]');
}

function zoomImage(page: Page) {
  return surface(page).locator('img');
}

function counter(page: Page) {
  return dialog(page).locator('[aria-hidden="true"]', { hasText: `/ ${TOTAL}` });
}

async function openPdp(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(gallery(page)).toHaveAttribute('data-hydrated', 'true');
}

async function openLightbox(page: Page, index = 0) {
  await gallery(page)
    .getByRole('button', { name: new RegExp(`^Apri immagine ${index + 1} `) })
    .click();
  await expect(dialog(page)).toBeVisible();
  await expect(surface(page)).toBeVisible();
  // I limiti del pan dipendono dalle dimensioni naturali: attende il load.
  await expect
    .poll(() => zoomImage(page).evaluate((el) => (el as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
}

async function currentScale(page: Page): Promise<number> {
  const value = await surface(page).getAttribute('data-zoom-scale');
  return Number(value);
}

async function currentTranslation(page: Page): Promise<{ x: number; y: number }> {
  return zoomImage(page).evaluate((el) => {
    const match = el.style.transform.match(
      /translate3d\((-?[\d.]+)px, (-?[\d.]+)px, 0(?:px)?\)/
    );
    return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: 0, y: 0 };
  });
}

/** Dispatch di una sequenza pointer touch sintetica sull'immagine. */
async function dispatchTouchSequence(
  page: Page,
  moves: readonly { type: 'down' | 'move' | 'up'; x: number; y: number }[],
  pointerId = 11
) {
  await zoomImage(page).evaluate(
    (el, { moves, pointerId }) => {
      const rect = el.getBoundingClientRect();
      for (const step of moves) {
        const eventType =
          step.type === 'down'
            ? 'pointerdown'
            : step.type === 'move'
              ? 'pointermove'
              : 'pointerup';
        el.dispatchEvent(
          new PointerEvent(eventType, {
            pointerId,
            pointerType: 'touch',
            isPrimary: true,
            bubbles: true,
            cancelable: true,
            clientX: rect.left + rect.width / 2 + step.x,
            clientY: rect.top + rect.height / 2 + step.y,
          })
        );
      }
    },
    { moves, pointerId }
  );
}

test.describe('Zoom — pulsanti e tastiera', () => {
  test('aumenta/riduci/ripristina con stati disabled a 1× e 4×', async ({ page }) => {
    await openPdp(page);
    await openLightbox(page);

    const zoomIn = dialog(page).getByRole('button', { name: 'Aumenta zoom' });
    const zoomOut = dialog(page).getByRole('button', { name: 'Riduci zoom' });
    const reset = dialog(page).getByRole('button', { name: 'Ripristina zoom' });

    await expect(zoomOut).toBeDisabled();
    await expect(reset).toBeDisabled();

    await zoomIn.click();
    await expect.poll(() => currentScale(page)).toBe(1.5);

    for (let i = 0; i < 5; i += 1) {
      if (await zoomIn.isEnabled()) await zoomIn.click();
    }
    await expect.poll(() => currentScale(page)).toBe(4);
    await expect(zoomIn).toBeDisabled();

    await zoomOut.click();
    await expect.poll(() => currentScale(page)).toBe(3.5);

    await reset.click();
    await expect.poll(() => currentScale(page)).toBe(1);
    await expect(zoomOut).toBeDisabled();
    await expect(reset).toBeDisabled();
  });

  test('tastiera +, - e 0', async ({ page }) => {
    await openPdp(page);
    await openLightbox(page);

    await page.keyboard.press('+');
    await expect.poll(() => currentScale(page)).toBe(1.5);

    await page.keyboard.press('+');
    await expect.poll(() => currentScale(page)).toBe(2);

    await page.keyboard.press('-');
    await expect.poll(() => currentScale(page)).toBe(1.5);

    await page.keyboard.press('0');
    await expect.poll(() => currentScale(page)).toBe(1);
  });

  test('lo stato accessibile riporta la percentuale di zoom', async ({ page }) => {
    await openPdp(page);
    await openLightbox(page);

    await dialog(page).getByRole('button', { name: 'Aumenta zoom' }).click();
    await expect(dialog(page).getByText('Zoom 150%')).toBeAttached();
  });
});

test.describe('Zoom — click desktop', () => {
  test('click alterna 1× → 2× → 1×', async ({ page }) => {
    await openPdp(page);
    await openLightbox(page);

    await zoomImage(page).click();
    await expect.poll(() => currentScale(page)).toBe(2);

    await zoomImage(page).click();
    await expect.poll(() => currentScale(page)).toBe(1);
  });

  test('zoom centrato sul punto cliccato', async ({ page }) => {
    await openPdp(page);
    await openLightbox(page);

    const box = (await zoomImage(page).boundingBox())!;
    // Click nel quadrante in alto a sinistra.
    await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.25);
    await expect.poll(() => currentScale(page)).toBe(2);

    const translation = await currentTranslation(page);
    // Focal point a sinistra/sopra il centro → traslazione positiva.
    expect(translation.x).toBeGreaterThan(0);
    expect(translation.y).toBeGreaterThan(0);
  });

  test('nessun click zoom dopo un drag', async ({ page }) => {
    await openPdp(page);
    await openLightbox(page);

    const box = (await zoomImage(page).boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 80, cy + 10, { steps: 4 });
    await page.mouse.up();

    await expect.poll(() => currentScale(page)).toBe(1);
    const translation = await currentTranslation(page);
    expect(translation.x).toBe(0);
    expect(translation.y).toBe(0);
  });
});

test.describe('Zoom — pan', () => {
  test('mouse pan a 2× limitato ai bounds; backdrop non si chiude', async ({ page }) => {
    await openPdp(page);
    await openLightbox(page);

    // 2× centrato: click sul centro.
    await zoomImage(page).click();
    await expect.poll(() => currentScale(page)).toBe(2);

    const box = (await zoomImage(page).boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 120, cy - 60, { steps: 6 });
    await page.mouse.up();

    const translation = await currentTranslation(page);
    expect(translation.x).toBeLessThan(0);
    expect(translation.y).toBeLessThan(0);
    // Ancora 2×: il pan non modifica la scala né chiude il dialog.
    await expect.poll(() => currentScale(page)).toBe(2);
    await expect(dialog(page)).toBeVisible();
  });

  test('nessun pan a 1×', async ({ page }) => {
    await openPdp(page);
    await openLightbox(page);

    const box = (await zoomImage(page).boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 60, cy, { steps: 4 });
    await page.mouse.up();

    const translation = await currentTranslation(page);
    expect(translation.x).toBe(0);
    expect(translation.y).toBe(0);
  });
});

test.describe('Zoom — wheel', () => {
  test('wheel senza modificatore non modifica la scala', async ({ page }) => {
    await openPdp(page);
    await openLightbox(page);

    await zoomImage(page).evaluate((el) => {
      el.dispatchEvent(
        new WheelEvent('wheel', { deltaY: -240, bubbles: true, cancelable: true })
      );
    });
    await page.waitForTimeout(400);
    await expect.poll(() => currentScale(page)).toBe(1);
  });

  test('Ctrl+wheel esegue zoom e si stabilizza dopo il debounce', async ({ page }) => {
    await openPdp(page);
    await openLightbox(page);

    await zoomImage(page).evaluate((el) => {
      for (let i = 0; i < 4; i += 1) {
        el.dispatchEvent(
          new WheelEvent('wheel', {
            deltaY: -120,
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
          })
        );
      }
    });

    // Commit con debounce 300ms.
    await expect.poll(() => currentScale(page)).toBeGreaterThan(1);
    expect(await currentScale(page)).toBeLessThanOrEqual(4);
  });
});

test.describe('Zoom — touch gesture sintetiche', () => {
  test('double tap alterna 1× e 2×', async ({ page }) => {
    await openPdp(page);
    await openLightbox(page);

    await dispatchTouchSequence(page, [
      { type: 'down', x: 0, y: 0 },
      { type: 'up', x: 0, y: 0 },
    ]);
    // Singolo tap: nessuno zoom.
    await expect.poll(() => currentScale(page)).toBe(1);

    await dispatchTouchSequence(page, [
      { type: 'down', x: 0, y: 0 },
      { type: 'up', x: 0, y: 0 },
    ]);
    // Secondo tap entro 280ms dal primo → double tap.
    await expect.poll(() => currentScale(page)).toBe(2);
  });

  test('swipe a 1× naviga alla successiva; nessuno swipe a 2×', async ({ page }) => {
    await openPdp(page);
    await openLightbox(page);
    await expect(counter(page)).toHaveText(`1 / ${TOTAL}`);

    // Swipe verso sinistra → successiva.
    await dispatchTouchSequence(page, [
      { type: 'down', x: 100, y: 0 },
      { type: 'move', x: 20, y: 5 },
      { type: 'move', x: -80, y: 8 },
      { type: 'up', x: -100, y: 10 },
    ]);
    await expect(counter(page)).toHaveText(`2 / ${TOTAL}`);
    await expect.poll(() => currentScale(page)).toBe(1);

    // A 2× lo stesso movimento esegue pan, non swipe.
    await zoomImage(page).click();
    await expect.poll(() => currentScale(page)).toBe(2);

    await dispatchTouchSequence(page, [
      { type: 'down', x: 100, y: 0 },
      { type: 'move', x: -80, y: 0 },
      { type: 'up', x: -100, y: 0 },
    ]);
    await expect(counter(page)).toHaveText(`2 / ${TOTAL}`);
    await expect.poll(() => currentScale(page)).toBe(2);
  });

  test('swipe verso destra sulla prima immagine non naviga (nessun loop)', async ({
    page,
  }) => {
    await openPdp(page);
    await openLightbox(page);

    await dispatchTouchSequence(page, [
      { type: 'down', x: -100, y: 0 },
      { type: 'move', x: 40, y: 0 },
      { type: 'up', x: 100, y: 0 },
    ]);
    await expect(counter(page)).toHaveText(`1 / ${TOTAL}`);
  });
});

test.describe('Zoom — reset e integrità', () => {
  test('il cambio immagine reimposta zoom e trasformazione', async ({ page }) => {
    await openPdp(page);
    await openLightbox(page);

    const box = (await zoomImage(page).boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.3);
    await expect.poll(() => currentScale(page)).toBe(2);

    await dialog(page).getByRole('button', { name: 'Immagine successiva' }).click();
    await expect(counter(page)).toHaveText(`2 / ${TOTAL}`);

    await expect.poll(() => currentScale(page)).toBe(1);
    const translation = await currentTranslation(page);
    expect(translation.x).toBe(0);
    expect(translation.y).toBe(0);
    await expect(dialog(page).getByText('Zoom 100%')).toBeAttached();
  });

  test('il focus resta nel dialog e non si verificano pageerror', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    await openPdp(page);
    await openLightbox(page);

    await zoomImage(page).click();
    await page.keyboard.press('+');
    await page.keyboard.press('0');
    await dialog(page).getByRole('button', { name: 'Aumenta zoom' }).click();

    const focusEscaped = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return false;
      if (el.tagName === 'DIALOG') return false;
      return el.closest('dialog') === null;
    });
    expect(focusEscaped).toBe(false);
    expect(pageErrors).toHaveLength(0);
  });

  async function expectNoSeriousViolations(page: Page) {
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious'
    );
    expect(
      blocking.map((violation) => `${violation.id}: ${violation.description}`)
    ).toEqual([]);
  }

  test('audit axe con zoom 2×', async ({ page }) => {
    await openPdp(page);
    await openLightbox(page);

    await zoomImage(page).click();
    await expect.poll(() => currentScale(page)).toBe(2);
    await expectNoSeriousViolations(page);
  });

  test('audit axe con zoom 4× e dopo ciclo apri/chiudi', async ({ page }) => {
    await openPdp(page);
    await openLightbox(page);

    const zoomIn = dialog(page).getByRole('button', { name: 'Aumenta zoom' });
    while (await zoomIn.isEnabled()) {
      await zoomIn.click();
    }
    await expect.poll(() => currentScale(page)).toBe(4);
    await expectNoSeriousViolations(page);

    await dialog(page).getByRole('button', { name: 'Chiudi galleria' }).click();
    await expect(dialog(page)).toBeHidden();
    await openLightbox(page, 1);
    await expectNoSeriousViolations(page);
  });
});
