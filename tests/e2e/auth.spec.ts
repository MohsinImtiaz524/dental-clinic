import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { db } from "../../lib/db";
import { hashPassword } from "../../lib/password";

const email = "admin@example.test";
const password = "Original secure passphrase!";

test.beforeAll(async () => {
  await mkdir(".local", { recursive: true });
  await db.user.deleteMany();
  await db.rateLimit.deleteMany();
  await db.user.create({ data: { email, name: "Test Administrator", passwordHash: await hashPassword(password) } });
});
test.afterAll(() => db.$disconnect());

test("login, logout, protected routes, and email password reset", async ({ page, browser }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "Sign in to workspace" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "incorrect" })).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in to workspace" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Welcome, Test Administrator." })).toBeVisible();
  const cookies = await page.context().cookies();
  const cookie = cookies.find(c => c.name === "clinic_session");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  // Keep another signed-in session to prove reset revocation across browsers.
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in to workspace" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const context = await browser.newContext();
  const recovery = await context.newPage();
  await recovery.goto("http://localhost:3100/login");
  await recovery.getByRole("link", { name: "Forgot password?" }).click();
  await expect(recovery.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
  await recovery.getByLabel("Email address").fill("unknown@example.test");
  await recovery.getByRole("button", { name: "Continue to change password" }).click();
  await expect(recovery.getByRole("status")).toContainText("If this email belongs");
  await recovery.reload();
  await recovery.getByLabel("Email address").fill(email);
  await recovery.getByRole("button", { name: "Continue to change password" }).click();
  await expect(recovery).toHaveURL(/\/reset-password\?token=[a-f0-9]+/);
  const link = recovery.url();
  await recovery.getByLabel("New password", { exact: true }).fill("Updated secure passphrase!");
  await recovery.getByLabel("Confirm new password").fill("Mismatched secure passphrase!");
  await recovery.getByRole("button", { name: "Update password" }).click();
  await expect(recovery.getByRole("alert").filter({ hasText: "do not match" })).toBeVisible();
  await recovery.getByLabel("Confirm new password").fill("Updated secure passphrase!");
  await recovery.getByRole("button", { name: "Update password" }).click();
  await expect(recovery).toHaveURL(/reset=success/);
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await recovery.goto(link);
  await expect(recovery.getByRole("heading", { name: "This link is no longer valid" })).toBeVisible();
  await recovery.goto("http://localhost:3100/login");
  await recovery.getByLabel("Email address").fill(email);
  await recovery.getByLabel("Password", { exact: true }).fill(password);
  await recovery.getByRole("button", { name: "Sign in to workspace" }).click();
  await expect(recovery.getByRole("alert").filter({ hasText: "incorrect" })).toBeVisible();
  await recovery.getByLabel("Password", { exact: true }).fill("Updated secure passphrase!");
  await recovery.getByRole("button", { name: "Sign in to workspace" }).click();
  await expect(recovery).toHaveURL(/\/dashboard$/);
  await recovery.screenshot({ path: ".local/dashboard-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".local/login-mobile.png", fullPage: true });
  await context.close();
});
