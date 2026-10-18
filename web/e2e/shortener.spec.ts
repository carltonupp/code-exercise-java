import { expect, test } from "@playwright/test";

test("creates a custom link, redirects, then shows a tombstone after deletion", async ({ page, request }) => {
  const alias = `pw-${Date.now().toString(36)}`;
  const destination = "https://example.com/playwright-check";

  await page.goto("/");
  await page.getByLabel("Long URL").fill(destination);
  await page.getByLabel("Custom alias").fill(alias);
  await page.getByRole("button", { name: "Create short link" }).click();

  const result = page.getByRole("region", { name: "Your short link is ready" });
  await expect(result.locator("output")).toHaveText(`http://localhost:13000/${alias}`);
  const aliasRow = page.locator(".link-entry").filter({ has: page.getByText(alias, { exact: true }) });
  await expect(aliasRow).toBeVisible();

  const redirect = await request.get(`/${alias}`, { maxRedirects: 0 });
  expect(redirect.status()).toBe(302);
  expect(redirect.headers().location).toBe(destination);

  await aliasRow.getByRole("button", { name: "Delete" }).click();
  await expect(page.locator(".list-success")).toHaveText(`Deleted ${alias}.`);
  await expect(page.locator(".link-entry").filter({ has: page.getByText(alias, { exact: true }) })).toHaveCount(0);

  const tombstone = await page.goto(`/${alias}`);
  expect(tombstone?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This link has been retired" })).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("color", "rgb(23, 43, 38)");
  const stylesheet = await request.get("/styles/shared.css");
  expect(stylesheet.status()).toBe(200);
  expect(stylesheet.headers()["content-type"]).toContain("text/css");
});

test("creates a generated alias and rejects an invalid custom alias", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Long URL").fill("example.com/generated-alias-check");
  await page.getByRole("button", { name: "Create short link" }).click();

  const output = page.locator(".short-link-result output");
  await expect(output).toHaveText(/http:\/\/localhost:13000\/[a-z0-9]{8}/);
  const generatedAlias = (await output.textContent())?.split("/").at(-1);
  expect(generatedAlias).toMatch(/^[a-z0-9]{8}$/);
  await expect(page.locator(".link-entry").filter({ has: page.getByText(generatedAlias!, { exact: true }) })).toBeVisible();

  await page.getByLabel("Long URL").fill("https://example.com/invalid-alias-check");
  await page.getByLabel("Custom alias").fill("no");
  await page.getByRole("button", { name: "Create short link" }).click();
  await expect(page.locator(".shorten-form > .form-error")).toContainText("Custom aliases must be 3–16 letters");
});
