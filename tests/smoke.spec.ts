import { expect, test } from "@playwright/test";

test("home filters update without navigation", async ({ page }) => {
  await page.goto("/");

  const initialUrl = page.url();
  await page.getByPlaceholder("Search...").fill("fulci");
  await page.getByRole("button", { name: "Search products" }).click();

  await expect(page).toHaveURL(initialUrl);
  await expect(page.getByText(/titles found/i).first()).toContainText("1");

  const catalogSection = page.locator("#catalog");
  await catalogSection.getByRole("button", { name: "newest" }).click();
  await catalogSection.getByRole("button", { name: "a-z" }).click();
  await catalogSection.getByRole("button", { name: "$ -> $$$" }).click();
  await catalogSection.getByRole("button", { name: "$ -> $$$" }).click();
  await catalogSection.getByRole("button", { name: "$$$ -> $" }).click();
});

test("cart hydrates persisted local state without runtime error", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "tomb-video-cart",
      JSON.stringify({
        cartId: "gid://shopify/Cart/test",
        checkoutUrl: "https://example.com/checkout",
        items: [
          {
            merchandiseId: "gid://shopify/ProductVariant/test-variant",
            productHandle: "test-handle",
            title: "Hydration Probe Item",
            variantTitle: "Default Title",
            imageUrl: "",
            priceAmount: "9.99",
            currencyCode: "USD",
            quantity: 1,
            maxQuantity: 2,
          },
        ],
      }),
    );
  });

  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Hydration Probe Item" })).toBeVisible();

  expect(runtimeErrors).not.toEqual(expect.arrayContaining([expect.stringMatching(/hydration failed/i)]));
});

test("quantity cap is enforced on out-of-print single-stock item", async ({ page }) => {
  await page.goto("/products/the-new-york-ripper-1982-lucio-fulci-collection-dvd");

  const addButton = page.getByRole("button", { name: /add to cart/i });
  await expect(addButton).toBeEnabled();
  await addButton.click();

  await expect(page.getByRole("link", { name: /cart \(1\)/i })).toBeVisible();
  await expect(addButton).toBeDisabled();
});

test("Blu-ray tag inventory renders expected titles", async ({ page }) => {
  await page.goto("/tags/Blu-ray");

  const grid = page.getByLabel("Product grid");
  await expect(grid.getByRole("link", { name: /Dawn of the Dead/i })).toBeVisible();
  await expect(grid.getByRole("link", { name: /Mad Max/i })).toBeVisible();
});
