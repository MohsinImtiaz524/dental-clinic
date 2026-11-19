import { defineConfig } from "@playwright/test";
import { execFileSync } from "node:child_process";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) throw new Error("Set TEST_DATABASE_URL to a dedicated PostgreSQL database before running end-to-end tests.");
process.env.DATABASE_URL = testDatabaseUrl;
process.env.DATABASE_URL_POOLED = testDatabaseUrl;
process.env.DIRECT_DATABASE_URL = testDatabaseUrl;
process.env.APP_URL = "http://localhost:3100";
process.env.MAIL_DELIVERY = "file";
execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy", "--config", "prisma7.config.ts"], { env: process.env, stdio: "pipe" });

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  timeout: 90000,
  expect: { timeout: 20000 },
  use: { baseURL: "http://localhost:3100", headless: true, launchOptions: { channel: "msedge" } },
  webServer: {
    command: `"${process.execPath}" node_modules/next/dist/bin/next dev --port 3100`,
    url: "http://localhost:3100/login",
    reuseExistingServer: false,
    timeout: 120000,
    env: { DATABASE_URL: testDatabaseUrl, DATABASE_URL_POOLED: testDatabaseUrl, APP_URL: process.env.APP_URL, MAIL_DELIVERY: "file", NEXT_DIST_DIR: ".next-e2e" },
  },
});
