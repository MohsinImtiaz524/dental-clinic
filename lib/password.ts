import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
export const passwordIsValid = (password: string) => password.length >= 12 && password.length <= 128;
export const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("hex");

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, encoded] = stored.split(":");
  if (algorithm !== "scrypt" || !salt || !encoded || encoded.length !== 128) return false;
  const hash = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(encoded, "hex");
  return hash.length === expected.length && timingSafeEqual(hash, expected);
}
