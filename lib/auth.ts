import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionUser } from "@/lib/auth-service";

export const SESSION_COOKIE = "clinic_session";
export async function getUser() {
  return sessionUser((await cookies()).get(SESSION_COOKIE)?.value);
}
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
