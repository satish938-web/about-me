const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export function apiUrl(path: string): string {
  return `${base}${path}`;
}
