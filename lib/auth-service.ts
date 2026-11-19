import { db } from "@/lib/db";
import { hashPassword, newToken, tokenHash, verifyPassword } from "@/lib/password";

export const SESSION_SECONDS = 60 * 60 * 12;
const DUMMY_HASH = "scrypt:00000000000000000000000000000000:" + "00".repeat(64);

export async function consumeLimit(key: string, maximum: number, seconds = 900) {
  const now = new Date();
  return db.$transaction(async (tx) => {
    await tx.rateLimit.deleteMany({ where: { expiresAt: { lte: now } } });
    const entry = await tx.rateLimit.upsert({
      where: { key: tokenHash(key) },
      create: { key: tokenHash(key), expiresAt: new Date(Date.now() + seconds * 1000) },
      update: { attempts: { increment: 1 } },
    });
    return entry.attempts <= maximum;
  });
}

export async function authenticate(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  return user && valid ? user : null;
}

export async function createSession(userId: string) {
  const token = newToken();
  await db.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  await db.session.create({ data: { tokenHash: tokenHash(token), userId, expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000) } });
  return token;
}

export async function sessionUser(token: string | undefined) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db.session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: true } });
  if (!session || session.expiresAt <= new Date()) return null;
  return { id: session.user.id, name: session.user.name, email: session.user.email };
}

export async function issueReset(userId: string) {
  const token = newToken();
  await db.passwordReset.upsert({ where: { userId }, create: { userId, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + 15 * 60 * 1000) }, update: { tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + 15 * 60 * 1000) } });
  return token;
}

export async function resetIsValid(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  return !!await db.passwordReset.findFirst({ where: { tokenHash: tokenHash(token), expiresAt: { gt: new Date() } } });
}

export async function changePassword(token: string, password: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  const passwordHash = await hashPassword(password);
  return db.$transaction(async (tx) => {
    const reset = await tx.passwordReset.findUnique({ where: { tokenHash: tokenHash(token) } });
    if (!reset || reset.expiresAt <= new Date()) return false;
    const consumed = await tx.passwordReset.deleteMany({ where: { tokenHash: reset.tokenHash, expiresAt: { gt: new Date() } } });
    if (!consumed.count) return false;
    await tx.user.update({ where: { id: reset.userId }, data: { passwordHash } });
    await tx.session.deleteMany({ where: { userId: reset.userId } });
    return true;
  });
}
