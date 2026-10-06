"use client";

/** Browser side fetch: goes through the Next rewrite to the Go API. */
export async function clientApi<T = any>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const res = await fetch(path, {
    method: init?.method || "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    signal: init?.signal ?? AbortSignal.timeout(10000),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw Object.assign(new Error(data?.error || `request failed (${res.status})`), {
      status: res.status,
      data,
    });
  }
  return data as T;
}
