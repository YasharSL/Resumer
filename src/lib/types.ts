export interface TemplateManifest {
  id: string;
  name: string;
  version: string;
  engine: "html-handlebars";
  page: {
    format: "A4" | "Letter";
    margin?: string;
  };
  entry: string;
  styles: string[];
  partialsDir?: string;
  schema: string;
  example: string;
  assetsDir?: string;
  features?: {
    multiPage?: boolean;
    clickableLinks?: boolean;
    photo?: "optional" | "required" | "none";
  };
}

export interface LoadedTemplate {
  rootDir: string;
  manifest: TemplateManifest;
}

export interface ResumeDocument {
  template?: string;
  extends?: string;
  meta?: {
    outputName?: string;
  };
  [key: string]: unknown;
}
