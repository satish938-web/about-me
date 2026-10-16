import { connection } from "next/server";

import { proxyPython } from "@/lib/python-proxy";

export const maxDuration = 60;

export async function POST(request: Request) {
  await connection();
  return proxyPython("/api/chat", request);
}
