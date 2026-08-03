import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import type { TemplateManifest } from "./types.js";

export async function htmlToPdf(options: {
  html: string;
  outputPath: string;
  page: TemplateManifest["page"];
}): Promise<string> {
  const { html, outputPath, page } = options;
  mkdirSync(path.dirname(outputPath), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const tab = await context.newPage();
    await tab.setContent(html, { waitUntil: "networkidle" });
    await tab.emulateMedia({ media: "print" });
    await tab.pdf({
      path: outputPath,
      format: page.format ?? "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });
  } finally {
    await browser.close();
  }

  return outputPath;
}
