import { readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import type { ResumeDocument } from "./types.js";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Deep merge: objects recurse; arrays and scalars from `override` replace. */
export function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Record<string, unknown>,
): T {
  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const existing = result[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      result[key] = deepMerge(existing, value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

export function loadYamlFile(filePath: string): ResumeDocument {
  const absolute = path.resolve(filePath);
  const raw = readFileSync(absolute, "utf8");
  const data = parseYaml(raw) as unknown;
  if (!isPlainObject(data)) {
    throw new Error(`Resume data must be a YAML object: ${absolute}`);
  }
  return data as ResumeDocument;
}

export function loadResumeData(filePath: string): {
  data: ResumeDocument;
  sourcePath: string;
} {
  const sourcePath = path.resolve(filePath);
  const doc = loadYamlFile(sourcePath);

  if (typeof doc.extends === "string" && doc.extends.trim()) {
    const basePath = path.resolve(path.dirname(sourcePath), doc.extends);
    const base = loadYamlFile(basePath);
    const { extends: _extends, ...rest } = doc;
    return {
      data: deepMerge(base, rest),
      sourcePath,
    };
  }

  return { data: doc, sourcePath };
}
