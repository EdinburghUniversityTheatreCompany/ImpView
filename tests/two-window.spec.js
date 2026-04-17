import { test, expect } from "@playwright/test";

// Opens the control window and clicks "Start Display", returning both pages
// after the hello handshake has dismissed the control-side loader.
async function openPair(context) {
  const control = await context.newPage();
  await control.goto("/");
  await expect(control.locator("#start_display_button")).toBeVisible();

  const [display] = await Promise.all([
    context.waitForEvent("page"),
    control.locator("#start_display_button").click(),
  ]);
  await display.waitForLoadState("domcontentloaded");

  // Loader disappears once the two-way hello message has been exchanged.
  await expect(control.locator("#loader")).toBeHidden({ timeout: 10_000 });
  await expect(control.locator("#controls")).toBeVisible();

  // Dismiss the display-side activation overlay so later gestures aren't swallowed.
  await display
    .locator("#activation-overlay")
    .click()
    .catch(() => {});

  return { control, display };
}

test("handshake: start display dismisses the waiting loader", async ({ context }) => {
  const { control, display } = await openPair(context);
  await expect(control.locator("#controls")).toBeVisible();
  await expect(display).toHaveTitle(/Display/);
});

test("image: preset click sets a background-image on display #image", async ({ context }) => {
  const { control, display } = await openPair(context);

  // Switch to the Image control group and click the first preset.
  await control.locator('.control-group[data-shortcut="3"] .preset-images a').first().click();

  await control.locator("#controls-fade-image").click();

  await expect
    .poll(async () => display.locator("#image").evaluate((el) => el.style.backgroundImage), {
      timeout: 10_000,
    })
    .toMatch(/^url\(/);
});

test("emoroco: commit creates a draft + displays text; focus toggles active state", async ({
  context,
}) => {
  const { control, display } = await openPair(context);

  const firstInput = control.locator('.emoroco-entry[data-id="0"] .emoroco-text');
  await firstInput.fill("Joyful");
  await firstInput.press("Enter");

  // After commit, the original entry is marked committed and a new draft appears.
  await expect(control.locator('.emoroco-entry.committed[data-id="0"]')).toBeVisible();
  await expect(control.locator(".emoroco-entry:not(.committed)")).toHaveCount(1);

  // Display gets the text node.
  await expect(display.locator(".emoroco-text", { hasText: "Joyful" })).toBeVisible();

  // Focus the committed entry.
  await control.locator('.emoroco-entry.committed[data-id="0"] .emoroco-focus').click();
  await expect(control.locator('.emoroco-entry[data-id="0"] .emoroco-focus.active')).toBeVisible();
  await expect(display.locator(".emoroco-text.emo-focused")).toHaveText("Joyful");
});

test("shortcut cheatsheet: pressing ? opens the help modal", async ({ context }) => {
  const { control } = await openPair(context);

  await control.locator("body").press("?");
  await expect(control.locator(".shortcut-help")).toBeVisible();
});
