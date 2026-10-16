const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");

export function apiUrl(path: string): string {
  return `${base}${path}`;
}
