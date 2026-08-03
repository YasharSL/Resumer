#!/usr/bin/env node
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { loadResumeData } from "./lib/load-data.js";
import { htmlToPdf } from "./lib/pdf.js";
import { startPreviewServer } from "./lib/preview.js";
import { renderResumeHtml } from "./lib/render.js";
import {
  createTemplateScaffold,
  discoverTemplates,
  getTemplate,
  projectRoot,
} from "./lib/templates.js";
import { validateResume } from "./lib/validate.js";

const program = new Command();

program
  .name("resume")
  .description("YAML-driven multi-template resume toolkit")
  .version("0.1.0");

program
  .command("templates")
  .description("List discovered templates")
  .action(() => {
    const templates = discoverTemplates();
    if (templates.length === 0) {
      console.log("No templates found under templates/");
      return;
    }
    for (const t of templates) {
      console.log(
        `${t.manifest.id.padEnd(24)} ${t.manifest.name} (v${t.manifest.version})`,
      );
    }
  });

program
  .command("template-create")
  .argument("<id>", "kebab-case template id")
  .description("Scaffold a new template package")
  .action((id: string) => {
    const dir = createTemplateScaffold(id);
    console.log(`Created template scaffold at ${dir}`);
  });

program
  .command("preview")
  .argument("[template]", "Template id")
  .argument("[data]", "Resume YAML path")
  .option("-t, --template <id>", "Template id")
  .option("-d, --data <path>", "Resume YAML path")
  .option("-p, --port <number>", "Preview port", "4173")
  .description("Live preview server")
  .action(
    async (
      templateArg: string | undefined,
      dataArg: string | undefined,
      opts: { template?: string; data?: string; port: string },
    ) => {
      const templateId = opts.template ?? templateArg;
      const dataPath = opts.data ?? dataArg;
      if (!templateId || !dataPath) {
        throw new Error("Provide template and data, e.g. preview -t classic-sidebar -d path/to.yaml");
      }
      const { url } = await startPreviewServer({
        templateId,
        dataPath,
        port: Number(opts.port),
      });
      console.log(`Preview: ${url}`);
      console.log("Watching for YAML/template changes. Press Ctrl+C to stop.");
    },
  );

program
  .command("build")
  .argument("[template]", "Template id")
  .argument("[data]", "Resume YAML path")
  .option("-t, --template <id>", "Template id")
  .option("-d, --data <path>", "Resume YAML path")
  .option("-o, --out <path>", "Output PDF path")
  .description("Build a single PDF")
  .action(
    async (
      templateArg: string | undefined,
      dataArg: string | undefined,
      opts: { template?: string; data?: string; out?: string },
    ) => {
      const templateId = opts.template ?? templateArg;
      const dataPath = opts.data ?? dataArg;
      if (!templateId || !dataPath) {
        throw new Error("Provide template and data, e.g. build -t classic-sidebar -d path/to.yaml");
      }
      const output = await buildOne(templateId, dataPath, opts.out);
      console.log(`Wrote ${output}`);
    },
  );

program
  .command("build-all")
  .option(
    "-d, --dir <path>",
    "Directory of version YAML files",
    "data/versions",
  )
  .description("Build every YAML resume under a versions directory")
  .action(async (opts: { dir: string }) => {
    const dir = path.resolve(projectRoot(), opts.dir);
    if (!existsSync(dir)) {
      throw new Error(`Versions directory not found: ${dir}`);
    }
    const files = readdirSync(dir)
      .filter((name: string) => name.endsWith(".yaml") || name.endsWith(".yml"))
      .sort();
    if (files.length === 0) {
      console.log(`No YAML files in ${dir}`);
      return;
    }
    for (const file of files) {
      const dataPath = path.join(dir, file);
      const { data } = loadResumeData(dataPath);
      const templateId =
        typeof data.template === "string" ? data.template : undefined;
      if (!templateId) {
        throw new Error(`${file} is missing required "template" field`);
      }
      const output = await buildOne(templateId, dataPath);
      console.log(`Wrote ${output}`);
    }
  });

async function buildOne(
  templateId: string,
  dataPath: string,
  out?: string,
): Promise<string> {
  const root = projectRoot();
  const template = getTemplate(templateId, root);
  const { data, sourcePath } = loadResumeData(dataPath);
  validateResume(template, data);

  const html = renderResumeHtml({
    template,
    data,
    sourcePath,
    projectRootDir: root,
  });

  const stem =
    (typeof data.meta === "object" &&
    data.meta &&
    "outputName" in data.meta &&
    typeof (data.meta as { outputName?: unknown }).outputName === "string"
      ? (data.meta as { outputName: string }).outputName
      : path.basename(sourcePath).replace(/\.(ya?ml)$/i, "")) || "resume";

  const outputPath = path.resolve(out ?? path.join(root, "out", `${stem}.pdf`));
  await htmlToPdf({
    html,
    outputPath,
    page: template.manifest.page,
  });
  return outputPath;
}

async function main(): Promise<void> {
  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
