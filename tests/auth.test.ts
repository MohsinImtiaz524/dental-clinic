import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl) {
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.DATABASE_URL_POOLED = testDatabaseUrl;
  process.env.DIRECT_DATABASE_URL = testDatabaseUrl;
  execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy", "--config", "prisma7.config.ts"], { env: process.env, stdio: "pipe" });
}

const databaseTest = testDatabaseUrl ? test : test.skip;
databaseTest("authentication and reset security", async (t) => {
  const { db } = await import("../lib/db");
  const { hashPassword, verifyPassword, tokenHash } = await import("../lib/password");
  const { authenticate, createSession, sessionUser, issueReset, resetIsValid, changePassword, consumeLimit } = await import("../lib/auth-service");
  t.after(() => db.$disconnect());
  await db.user.deleteMany();
  await db.rateLimit.deleteMany();
  const password = "A strong original passphrase!";
  const passwordHash = await hashPassword(password);
  const user = await db.user.create({ data: { name: "Test Admin", email: "admin@example.test", passwordHash } });
  await t.test("password is salted and hashed", async () => {
    assert.notEqual(passwordHash, password);
    assert.ok(passwordHash.startsWith("scrypt:"));
    assert.notEqual(await hashPassword(password), passwordHash);
    assert.equal(await verifyPassword(password, passwordHash), true);
    assert.equal(await verifyPassword("wrong-password", passwordHash), false);
  });
  await t.test("correct credentials succeed and incorrect credentials fail", async () => {
    assert.equal((await authenticate(user.email, password))?.id, user.id);
    assert.equal(await authenticate(user.email, "incorrect"), null);
    assert.equal(await authenticate("unknown@example.test", password), null);
  });
  const session = await createSession(user.id);
  await t.test("sessions reject missing, forged, and expired cookies", async () => {
    assert.equal((await sessionUser(session))?.id, user.id);
    assert.equal(await sessionUser(undefined), null);
    assert.equal(await sessionUser("f".repeat(64)), null);
    const expired = await createSession(user.id);
    await db.session.update({ where: { tokenHash: tokenHash(expired) }, data: { expiresAt: new Date(0) } });
    assert.equal(await sessionUser(expired), null);
    assert.equal(await db.session.count({ where: { tokenHash: session } }), 0);
  });
  await t.test("reset links expire and new links invalidate previous links", async () => {
    const old = await issueReset(user.id);
    const current = await issueReset(user.id);
    assert.equal(await resetIsValid(old), false);
    assert.equal(await resetIsValid(current), true);
    await db.passwordReset.update({ where: { userId: user.id }, data: { expiresAt: new Date(0) } });
    assert.equal(await changePassword(current, "Another long passphrase!"), false);
    assert.equal(await changePassword("invalid", password), false);
  });
  await t.test("reset is single use and revokes every session", async () => {
    const reset = await issueReset(user.id);
    assert.equal(await changePassword(reset, "My updated secure passphrase!"), true);
    assert.equal(await changePassword(reset, "A replayed secure passphrase!"), false);
    assert.equal(await sessionUser(session), null);
    assert.equal(await authenticate(user.email, password), null);
    assert.ok(await authenticate(user.email, "My updated secure passphrase!"));
  });
  await t.test("rate limits are persisted and expire", async () => {
    assert.equal(await consumeLimit("test", 2), true);
    assert.equal(await consumeLimit("test", 2), true);
    assert.equal(await consumeLimit("test", 2), false);
    await db.rateLimit.updateMany({ data: { expiresAt: new Date(0) } });
    assert.equal(await consumeLimit("test", 2), true);
  });
});
