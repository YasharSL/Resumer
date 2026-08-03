import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { watch } from "chokidar";
import { loadResumeData } from "./load-data.js";
import { renderResumeHtml } from "./render.js";
import { getTemplate, projectRoot, templatesRoot } from "./templates.js";
import { validateResume } from "./validate.js";

const RELOAD_SCRIPT = `
<script>
(() => {
  const es = new EventSource("/events");
  es.onmessage = () => location.reload();
  es.onerror = () => {};
})();
</script>
`;

export async function startPreviewServer(options: {
  templateId: string;
  dataPath: string;
  port?: number;
}): Promise<{ url: string; close: () => Promise<void> }> {
  const port = options.port ?? 4173;
  const root = projectRoot();
  let clients: ServerResponse[] = [];

  const render = (): string => {
    const template = getTemplate(options.templateId, root);
    const { data, sourcePath } = loadResumeData(options.dataPath);
    validateResume(template, data);
    const html = renderResumeHtml({
      template,
      data,
      sourcePath,
      projectRootDir: root,
    });
    return html.replace("</body>", `${RELOAD_SCRIPT}</body>`);
  };

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    try {
      if (req.url === "/events") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        res.write("\n");
        clients.push(res);
        req.on("close", () => {
          clients = clients.filter((c) => c !== res);
        });
        return;
      }

      if (req.url === "/" || req.url === "/index.html") {
        const html = render();
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    } catch (error) {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(message);
    }
  });

  const notify = (): void => {
    for (const client of clients) {
      client.write("data: reload\n\n");
    }
  };

  const watcher = watch(
    [
      path.resolve(options.dataPath),
      path.dirname(path.resolve(options.dataPath)),
      path.join(templatesRoot(root), options.templateId),
    ],
    {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    },
  );
  watcher.on("all", () => {
    notify();
  });

  await new Promise<void>((resolve) => {
    server.listen(port, resolve);
  });
  const url = `http://127.0.0.1:${port}`;

  return {
    url,
    close: async () => {
      await watcher.close();
      for (const client of clients) client.end();
      await new Promise<void>((resolve, reject) => {
        server.close((err?: Error | null) => (err ? reject(err) : resolve()));
      });
    },
  };
}
