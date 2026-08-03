import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { LoadedTemplate, TemplateManifest } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function projectRoot(): string {
  return path.resolve(__dirname, "../..");
}

export function templatesRoot(root = projectRoot()): string {
  return path.join(root, "templates");
}

export function loadManifest(templateDir: string): TemplateManifest {
  const manifestPath = path.join(templateDir, "template.manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing template.manifest.json in ${templateDir}`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as TemplateManifest;
  if (!manifest.id || !manifest.entry || !manifest.schema) {
    throw new Error(`Invalid manifest in ${manifestPath}`);
  }
  return manifest;
}

export function discoverTemplates(root = projectRoot()): LoadedTemplate[] {
  const dir = templatesRoot(root);
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry: { isDirectory: () => boolean }) => entry.isDirectory())
    .map((entry: { name: string }) => {
      const rootDir = path.join(dir, entry.name);
      const manifestPath = path.join(rootDir, "template.manifest.json");
      if (!existsSync(manifestPath)) return null;
      const manifest = loadManifest(rootDir);
      return { rootDir, manifest };
    })
    .filter((value: LoadedTemplate | null): value is LoadedTemplate => value !== null)
    .sort((a: LoadedTemplate, b: LoadedTemplate) =>
      a.manifest.id.localeCompare(b.manifest.id),
    );
}

export function getTemplate(id: string, root = projectRoot()): LoadedTemplate {
  const found = discoverTemplates(root).find((t) => t.manifest.id === id);
  if (!found) {
    const available = discoverTemplates(root)
      .map((t) => t.manifest.id)
      .join(", ");
    throw new Error(
      `Template "${id}" not found.${available ? ` Available: ${available}` : " No templates installed."}`,
    );
  }
  return found;
}

export function createTemplateScaffold(id: string, root = projectRoot()): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error("Template id must be kebab-case (e.g. cool-two-column)");
  }

  const templateDir = path.join(templatesRoot(root), id);
  if (existsSync(templateDir)) {
    throw new Error(`Template already exists: ${templateDir}`);
  }

  const srcDir = path.join(templateDir, "src");
  const partialsDir = path.join(srcDir, "partials");
  const assetsDir = path.join(srcDir, "assets");
  mkdirSync(partialsDir, { recursive: true });
  mkdirSync(assetsDir, { recursive: true });

  const title = id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const manifest: TemplateManifest = {
    id,
    name: title,
    version: "1.0.0",
    engine: "html-handlebars",
    page: { format: "A4", margin: "0mm" },
    entry: "src/index.hbs",
    styles: ["src/styles.css"],
    partialsDir: "src/partials",
    schema: "schema.json",
    example: "example.yaml",
    assetsDir: "src/assets",
    features: {
      multiPage: true,
      clickableLinks: true,
      photo: "optional",
    },
  };

  writeFileSync(
    path.join(templateDir, "template.manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  writeFileSync(
    path.join(templateDir, "schema.json"),
    `${JSON.stringify(
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        additionalProperties: true,
        required: ["basics"],
        properties: {
          template: { type: "string" },
          extends: { type: "string" },
          meta: {
            type: "object",
            properties: { outputName: { type: "string" } },
          },
          basics: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" },
              title: { type: "string" },
              summary: { type: "string" },
              email: { type: "string" },
            },
          },
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  writeFileSync(
    path.join(templateDir, "example.yaml"),
    `template: ${id}
meta:
  outputName: ${id}-example
basics:
  name: Ada Lovelace
  title: Software Engineer
  summary: Example resume for the ${title} template.
  email: ada@example.com
`,
    "utf8",
  );

  writeFileSync(
    path.join(templateDir, "README.md"),
    `# ${title}

Template id: \`${id}\`

## Features

- Multi-page A4 flow
- Clickable links (add real \`<a href>\` in partials)
- Photo: optional (declare in \`schema.json\` if used)

## Develop

\`\`\`bash
npm run preview -- --template ${id} --data templates/${id}/example.yaml
npm run build -- --template ${id} --data templates/${id}/example.yaml
\`\`\`

## Rules

- Use normal document flow for body content (no absolute positioning)
- Render arrays with Handlebars \`{{#each}}\`
- Keep content in YAML; keep layout in this template
`,
    "utf8",
  );

  writeFileSync(
    path.join(srcDir, "index.hbs"),
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{{basics.name}} — Resume</title>
  <style>{{{styles}}}</style>
</head>
<body>
  <main class="page">
    <h1>{{basics.name}}</h1>
    {{#if basics.title}}<p class="title">{{basics.title}}</p>{{/if}}
    {{#if basics.summary}}<p class="summary">{{basics.summary}}</p>{{/if}}
    {{#if basics.email}}
      <p><a href="mailto:{{basics.email}}">{{basics.email}}</a></p>
    {{/if}}
  </main>
</body>
</html>
`,
    "utf8",
  );

  writeFileSync(
    path.join(srcDir, "styles.css"),
    `@page {
  size: A4;
  margin: 0;
}

:root {
  --ink: #212121;
  --muted: #6b6b6b;
  --line: #d9d9d9;
  --bg: #ffffff;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
}

.page {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 18mm 16mm;
}

h1 {
  margin: 0 0 0.25rem;
  font-size: 2rem;
}

.title,
.summary {
  color: var(--muted);
}

a {
  color: inherit;
}
`,
    "utf8",
  );

  writeFileSync(path.join(partialsDir, ".gitkeep"), "", "utf8");
  writeFileSync(path.join(assetsDir, ".gitkeep"), "", "utf8");

  return templateDir;
}
