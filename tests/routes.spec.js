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

async function expectLinkedCitationMarkers(page) {
  const unresolved = await page.locator("article").evaluate((article) => {
    const excluded = [
      "a",
      "button",
      "code",
      "pre",
      "svg",
      ".katex",
      ".widget-card",
      "[data-citation-list]",
    ].join(", ");
    const marker = /\[(\d+)\]/g;
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
    const bareMarkers = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement?.closest(excluded)) continue;
      marker.lastIndex = 0;
      let match;
      while ((match = marker.exec(node.nodeValue))) {
        if (article.querySelector(`[id="ref-${match[1]}"]`)) {
          bareMarkers.push(match[0]);
        }
      }
    }
    return bareMarkers;
  });

  const invalidLinks = await page.locator("article").evaluate((article) => (
    [...article.querySelectorAll("a.citation-marker")]
      .map((link) => link.getAttribute("href"))
      .filter((href) => !href || !article.querySelector(href))
  ));

  await expect(unresolved).toEqual([]);
  await expect(invalidLinks).toEqual([]);
}

async function expectProductionFonts(page) {
  const missing = await page.evaluate(async () => {
    const required = [
      "400 16px Inter",
      '400 16px "JetBrains Mono"',
      '600 16px "Crimson Pro"',
      "400 16px KaTeX_Main",
    ];
    await Promise.all(required.map((descriptor) => document.fonts.load(descriptor, "Q5")));
    await document.fonts.ready;
    return required.filter((descriptor) => !document.fonts.check(descriptor));
  });

  await expect(missing).toEqual([]);
}

test("home route renders without console errors", async ({ page }) => {
  await expectRenderedWithoutErrors(page, "/", "h1", "darvinyi-textbook");
  await expectProductionFonts(page);
});

for (const chapter of CHAPTERS) {
  test(`Chapter ${chapter.num} renders without console errors`, async ({ page }) => {
    await expectRenderedWithoutErrors(
      page,
      chapter.path,
      "article h1",
      `Ch ${chapter.num} · ${chapter.title} — darvinyi-textbook`,
    );
    await expect(page.locator(".widget-card")).toHaveCount(chapter.widgets);
    await expectLinkedCitationMarkers(page);
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
