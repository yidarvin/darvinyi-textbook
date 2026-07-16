import { expect, test } from "@playwright/test";
import { CHAPTERS } from "../src/data/chapters.js";

function capturePageErrors(page) {
  const errors = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  return errors;
}

async function expectRenderedWithoutErrors(page, path, heading, title) {
  const errors = capturePageErrors(page);

  await page.goto(path);
  await expect(page.locator(heading)).toBeVisible();
  await expect(page).toHaveTitle(title);
  await expect(errors).toEqual([]);
}

test("home route renders without console errors", async ({ page }) => {
  await expectRenderedWithoutErrors(page, "/", "h1", "darvinyi-textbook");
});

for (const chapter of CHAPTERS) {
  test(`Chapter ${chapter.num} renders without console errors`, async ({ page }) => {
    await expectRenderedWithoutErrors(
      page,
      chapter.path,
      "article h1",
      `Ch ${chapter.num} · ${chapter.title} — darvinyi-textbook`,
    );
  });
}

test("unknown routes render the not-found page without console errors", async ({ page }) => {
  await expectRenderedWithoutErrors(
    page,
    "/not-a-route",
    "h1",
    "Page not found — darvinyi-textbook",
  );
});
