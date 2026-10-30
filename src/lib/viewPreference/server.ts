import { cookies } from "next/headers";

export async function getViewPreference<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T
): Promise<T> {
  const value = (await cookies()).get(key)?.value;
  return allowed.includes(value as T) ? (value as T) : fallback;
}
