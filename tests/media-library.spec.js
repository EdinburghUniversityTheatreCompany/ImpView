import { test, expect } from "@playwright/test";

// 1x1 transparent PNG — 67 bytes. Kept inline so the test doesn't depend on a fixture file.
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

async function openPair(context) {
  const control = await context.newPage();
  await control.goto("/");
  await expect(control.locator("#start_display_button")).toBeVisible();

  const [display] = await Promise.all([
    context.waitForEvent("page"),
    control.locator("#start_display_button").click(),
  ]);
  await display.waitForLoadState("domcontentloaded");
  await expect(control.locator("#loader")).toBeHidden({ timeout: 10_000 });
  await expect(control.locator("#controls")).toBeVisible();
  await display
    .locator("#activation-overlay")
    .click()
    .catch(() => {});
  return { control, display };
}

// Wipe the media IndexedDB before each test so runs are independent.
test.beforeEach(async ({ context }) => {
  const page = await context.newPage();
  await page.goto("/");
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const req = indexedDB.deleteDatabase("impview-media");
        req.onsuccess = req.onerror = req.onblocked = () => resolve();
      })
  );
  await page.close();
});

test("upload image: tile renders and clicking it shows on display", async ({ context }) => {
  const { control, display } = await openPair(context);

  await control.locator('.control-group[data-shortcut="3"] #upload-image-file').setInputFiles({
    name: "test.png",
    mimeType: "image/png",
    buffer: PNG_1X1,
  });

  const tile = control.locator(".uploaded-images .uploaded-tile").first();
  await expect(tile).toBeVisible({ timeout: 5_000 });

  await tile.click();
  await control.locator("#controls-fade-image").click();

  await expect
    .poll(async () => display.locator("#image").evaluate((el) => el.style.backgroundImage), {
      timeout: 10_000,
    })
    .toMatch(/^url\(/);
});

test("upload image twice: second upload is reported as duplicate", async ({ context }) => {
  const { control } = await openPair(context);

  const fileInput = control.locator("#upload-image-file");
  await fileInput.setInputFiles({ name: "dup.png", mimeType: "image/png", buffer: PNG_1X1 });
  await expect(control.locator(".uploaded-images .uploaded-tile")).toHaveCount(1, {
    timeout: 5_000,
  });

  await fileInput.setInputFiles({ name: "dup.png", mimeType: "image/png", buffer: PNG_1X1 });
  await expect(control.locator("#controls-image-loader")).toContainText(/duplicate/i, {
    timeout: 5_000,
  });
  await expect(control.locator(".uploaded-images .uploaded-tile")).toHaveCount(1);
});

test("delete upload: confirm modal dismisses tile", async ({ context }) => {
  const { control } = await openPair(context);

  await control.locator("#upload-image-file").setInputFiles({
    name: "delete-me.png",
    mimeType: "image/png",
    buffer: PNG_1X1,
  });
  const tile = control.locator(".uploaded-images .uploaded-tile").first();
  await expect(tile).toBeVisible({ timeout: 5_000 });

  // Force the delete button visible (it's opacity 0 until hover) and click it.
  await tile.locator(".delete-upload").evaluate((el) => el.click());

  const confirm = control.locator(".modal .confirm-modal");
  await expect(confirm).toBeVisible();
  await confirm.click();

  await expect(control.locator(".uploaded-images .uploaded-tile")).toHaveCount(0, {
    timeout: 5_000,
  });
});
