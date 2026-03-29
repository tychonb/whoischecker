import { test, expect } from "@playwright/test";

test("login page shows demo credentials", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByText("eva@monitoring.internal")).toBeVisible();
  await expect(page.getByRole("button", { name: "Platform openen" })).toBeVisible();
});
