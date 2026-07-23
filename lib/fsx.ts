import fs from "node:fs";
import path from "node:path";

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function writeJson(filePath: string, data: unknown, pretty = false): void {
  ensureDir(path.dirname(filePath));
  const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  fs.writeFileSync(filePath, json);
}

export function readJson<T = unknown>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function readJsonIfExists<T = unknown>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return readJson<T>(filePath);
}

export function exists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
}

/** Age of a file in milliseconds, or Infinity if it doesn't exist. */
export function fileAgeMs(filePath: string, nowMs: number): number {
  if (!fs.existsSync(filePath)) return Infinity;
  return nowMs - fs.statSync(filePath).mtimeMs;
}
