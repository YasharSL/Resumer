import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import Handlebars from "handlebars";
import type { LoadedTemplate, ResumeDocument } from "./types.js";

function registerHelpers(instance: typeof Handlebars): void {
  instance.registerHelper("yearRange", (start?: string, end?: string) => {
    if (!start && !end) return "";
    if (!end) return `${start ?? ""} – present`;
    if (!start) return end;
    return `${start} – ${end}`;
  });

  instance.registerHelper("displayUrl", (url?: string) => {
    if (!url) return "";
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  });

  instance.registerHelper("eq", (a: unknown, b: unknown) => a === b);
}

function loadPartials(instance: typeof Handlebars, template: LoadedTemplate): void {
  const rel = template.manifest.partialsDir;
  if (!rel) return;
  const dir = path.join(template.rootDir, rel);
  if (!existsSync(dir)) return;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".hbs")) continue;
    const name = entry.name.replace(/\.hbs$/, "");
    const source = readFileSync(path.join(dir, entry.name), "utf8");
    instance.registerPartial(name, source);
  }
}

function loadStyles(template: LoadedTemplate): string {
  return (template.manifest.styles ?? [])
    .map((rel) => {
      const file = path.join(template.rootDir, rel);
      if (!existsSync(file)) {
        throw new Error(`Missing stylesheet: ${file}`);
      }
      return readFileSync(file, "utf8");
    })
    .join("\n\n");
}

export function resolveAssetPath(
  maybePath: string | undefined,
  sourcePath: string,
  projectRootDir: string,
): string | undefined {
  if (!maybePath) return undefined;
  if (path.isAbsolute(maybePath)) return maybePath;
  const fromData = path.resolve(path.dirname(sourcePath), maybePath);
  if (existsSync(fromData)) return fromData;
  const fromRoot = path.resolve(projectRootDir, maybePath);
  if (existsSync(fromRoot)) return fromRoot;
  return fromData;
}

export function renderResumeHtml(options: {
  template: LoadedTemplate;
  data: ResumeDocument;
  sourcePath: string;
  projectRootDir: string;
  extra?: Record<string, unknown>;
}): string {
  const { template, data, sourcePath, projectRootDir, extra } = options;
  const hbs = Handlebars.create();
  registerHelpers(hbs);
  loadPartials(hbs, template);

  const entryPath = path.join(template.rootDir, template.manifest.entry);
  if (!existsSync(entryPath)) {
    throw new Error(`Missing template entry: ${entryPath}`);
  }

  const photoField =
    typeof data.photo === "string"
      ? data.photo
      : isRecord(data.photo) && typeof data.photo.path === "string"
        ? data.photo.path
        : undefined;

  const photoAbs = resolveAssetPath(photoField, sourcePath, projectRootDir);
  let photoDataUri: string | undefined;
  if (photoAbs && existsSync(photoAbs)) {
    const ext = path.extname(photoAbs).toLowerCase().replace(".", "") || "jpeg";
    const mime = ext === "jpg" ? "jpeg" : ext;
    const buf = readFileSync(photoAbs);
    photoDataUri = `data:image/${mime};base64,${buf.toString("base64")}`;
  }

  const compiled = hbs.compile(readFileSync(entryPath, "utf8"));
  return compiled({
    ...data,
    styles: loadStyles(template),
    photoSrc: photoDataUri,
    __sourcePath: sourcePath,
    __templateId: template.manifest.id,
    ...extra,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
