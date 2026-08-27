import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const source = resolve("apps/web/.next/static");
const destination = resolve("apps/web/.next/standalone/apps/web/.next/static");

if (!existsSync(source)) {
  throw new Error(`Next.js static output is missing: ${source}`);
}

mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true, force: true });
console.log("Copied Next.js static assets into the standalone output.");
