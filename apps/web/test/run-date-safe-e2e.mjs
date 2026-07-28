import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const target = process.argv[2];
if (!target) {
  throw new Error("Usage: node test/run-date-safe-e2e.mjs <test-file>");
}

const absoluteTarget = path.resolve(target);
const source = await readFile(absoluteTarget, "utf8");
const currentDate = new Date().toISOString().slice(0, 10);
const datedSource = source.replace(
  /const asOf = "\d{4}-\d{2}-\d{2}";/,
  `const asOf = "${currentDate}";`,
);

if (datedSource === source) {
  throw new Error(`No fixed asOf declaration found in ${target}`);
}

const directory = await mkdtemp(path.join(tmpdir(), "r4c-date-safe-e2e-"));
const temporaryTest = path.join(directory, path.basename(target));
await writeFile(temporaryTest, datedSource, "utf8");

const child = spawn(process.execPath, ["--test", temporaryTest], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

const exitCode = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code, signal) => {
    if (signal) reject(new Error(`Test process terminated by ${signal}`));
    else resolve(code ?? 1);
  });
});

await rm(directory, { recursive: true, force: true });
process.exitCode = exitCode;
