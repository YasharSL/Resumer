import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { ErrorObject, ValidateFunction } from "ajv";
import type { LoadedTemplate, ResumeDocument } from "./types.js";

const require = createRequire(import.meta.url);
const Ajv2020 = require("ajv/dist/2020.js") as new (options?: object) => {
  compile: (schema: object) => ValidateFunction;
  removeSchema: (schemaKeyRef?: object | string | RegExp) => unknown;
};
const addFormats = require("ajv-formats") as (
  ajv: unknown,
  options?: object,
) => unknown;

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  allowUnionTypes: true,
});
addFormats(ajv);

const validators = new Map<string, ValidateFunction>();

export function validateResume(
  template: LoadedTemplate,
  data: ResumeDocument,
): void {
  const cacheKey = template.manifest.id;
  let validate = validators.get(cacheKey);
  if (!validate) {
    const schemaPath = path.join(template.rootDir, template.manifest.schema);
    const schema = JSON.parse(readFileSync(schemaPath, "utf8")) as {
      $id?: string;
      [key: string]: unknown;
    };
    if (schema.$id) {
      ajv.removeSchema(schema.$id);
    }
    validate = ajv.compile(schema);
    validators.set(cacheKey, validate);
  }

  if (!validate(data)) {
    const details = ((validate.errors ?? []) as ErrorObject[])
      .map((err) => `${err.instancePath || "/"} ${err.message}`)
      .join("\n");
    throw new Error(
      `Resume data failed schema validation for "${template.manifest.id}":\n${details}`,
    );
  }
}
