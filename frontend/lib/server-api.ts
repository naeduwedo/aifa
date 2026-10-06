import type { Lang } from "./types";

export const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:8080";

/** Server-side fetch straight to the Go API. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_ORIGIN}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    signal: init?.signal ?? AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`API ${path} -> ${res.status}`);
  }
  return (await res.json()) as T;
}

export const withLang = (path: string, lang: Lang) =>
  path.includes("?") ? `${path}&lang=${lang}` : `${path}?lang=${lang}`;
