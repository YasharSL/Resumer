# Adding a template

Templates are self-contained packages under `templates/<id>/`.  
The folder name should match the manifest `id` (kebab-case).

## Quick start

```bash
npm run template:create -- my-template
npm run preview -- my-template templates/my-template/example.yaml
npm run build -- my-template templates/my-template/example.yaml
```

## Required contract


| Path                     | Purpose                              |
| ------------------------ | ------------------------------------ |
| `template.manifest.json` | Public metadata and entry points     |
| `schema.json`            | JSON Schema for this template’s YAML |
| `example.yaml`           | Sample resume that renders cleanly   |
| `src/index.hbs`          | Handlebars entry                     |
| `src/styles.css`         | Print + screen styles                |
| `README.md`              | Template-specific notes              |


Optional:

- `src/partials/*.hbs`
- `src/assets/` for icons/fonts owned by the template



### Manifest fields

```json
{
  "id": "my-template",
  "name": "My Template",
  "version": "1.0.0",
  "engine": "html-handlebars",
  "page": { "format": "A4", "margin": "0mm" },
  "entry": "src/index.hbs",
  "styles": ["src/styles.css"],
  "partialsDir": "src/partials",
  "schema": "schema.json",
  "example": "example.yaml",
  "assetsDir": "src/assets",
  "features": {
    "multiPage": true,
    "clickableLinks": true,
    "photo": "optional"
  }
}
```

`photo` is template-specific: use `"optional"`, `"required"`, or `"none"`, and mirror that in `schema.json`.

## Checklist before opening a PR

1. `example.yaml` validates against `schema.json`
2. Preview looks correct at A4 width
3. PDF text is selectable
4. LinkedIn/GitHub/email use real `<a href>` tags when present
5. A long fixture (many skills/jobs) flows to page 2+ without clipping
6. Template README documents sections and photo behavior



## Data files for end users

Resume versions usually live in `data/versions/*.yaml` and may use:

```yaml
template: my-template
extends: ../base.yaml
meta:
  outputName: my-role
```

Arrays in the version file replace arrays from the base file (no deep list merging).