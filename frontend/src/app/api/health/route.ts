import { connection } from "next/server";

import { proxyPython } from "@/lib/python-proxy";

export async function GET() {
  await connection();
  return proxyPython("/api/health");
}
