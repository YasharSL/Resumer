# Resumer

> Easiest resume builder ever ... probably

YAML-driven, multi-template resume toolkit.

Edit content in YAML → live preview in the browser → export selectable, clickable A4 PDFs.

## Features

- **Multiple versions** from shared base YAML (`extends`)
- **Multiple templates** via a strict folder contract (`templates/<id>/`)
- **Live preview** with hot reload on file changes
- **A4 PDF export** through Playwright - text + links are preserved
- **Scalable sections** — add as many jobs/skills as you want; content flows to the next page
- **Open-Source Ready** scaffold: `npm run template:create`

## Quick start

```bash
npm install
npm run preview -- classic-sidebar templates/classic-sidebar/example.yaml
```

Build one PDF:

```bash
npm run build -- classic-sidebar data/versions/example.yaml
```

Flags also work: `-t classic-sidebar -d path/to.yaml`.

Build every version under `data/versions/`:

```bash
npm run build:all
```

List templates:

```bash
npm run templates
```

## Project layout

```text
data/
  base.yaml                 # shared personal defaults
  versions/*.yaml           # one file per resume variant
templates/
  classic-sidebar/          # templates
  */
src/                        # CLI + render/pdf pipeline
docs/adding-a-template.md   # contributor contract
out/                        # generated PDFs (gitignored)
```

## Authoring a version

```yaml
template: classic-sidebar
extends: ../base.yaml
meta:
  outputName: example-backend

basics:
  title: Backend-leaning Product Engineer

experience:
  - role: Engineer
    company: Example
    start: "2024"
    end: present
    highlights:
      - Ship reliable APIs
skills:
  - name: TypeScript
```

GitHub / LinkedIn must be real URLs so the PDF links work:

```yaml
profiles:
  github:
    url: https://github.com/you
    label: you
  linkedin:
    url: https://www.linkedin.com/in/you
    label: you
```

## Templates:

## - `classic-sidebar`

- Optional photo via `photo: path/to.jpg` (template-specific)
- Clickable email / GitHub / LinkedIn
- Multi-page flow for long content (`data/versions/overflow-fixture.yaml`)

See `[templates/classic-sidebar/README.md](templates/classic-sidebar/README.md)`.

## Contribute a template (PRs are very welcome)

We want community templates in `templates/`. If you build a layout others can reuse, open a pull request and we’ll review it for the shared list.

### 1. Fork and scaffold

```bash
git clone <your-fork-url>
cd my-resume
npm install
npm run template:create -- your-template-id
```

Use a kebab-case id (`cool-two-column`, not `Cool Two Column`). The folder name must match `template.manifest.json` → `id`.

### 2. Implement the contract

Your PR should add only `templates/<id>/` (plus README mention if you want it listed above). Required files:


| Path                     | Purpose                              |
| ------------------------ | ------------------------------------ |
| `template.manifest.json` | Metadata + entry points              |
| `schema.json`            | JSON Schema for this template’s YAML |
| `example.yaml`           | Sample resume that renders cleanly   |
| `src/index.hbs`          | Handlebars entry                     |
| `src/styles.css`         | Screen + print (A4) styles           |
| `README.md`              | Sections, photo rules, quirks        |


Details and anti-patterns: `[docs/adding-a-template.md](docs/adding-a-template.md)`.

### 3. Verify locally

```bash
npm run preview -- your-template-id templates/your-template-id/example.yaml
npm run build -- your-template-id templates/your-template-id/example.yaml
npm run templates
```

Check that:

- `example.yaml` validates and looks right at A4 width
- PDF text is selectable
- Email / GitHub / LinkedIn are real `<a href>` links when present
- Long content flows to page 2+ without clipping
- Photo behavior matches what you declare (`optional` / `required` / `none`)

### 4. Open the PR

1. Branch from the default branch
2. Commit only your template package (you **can** use personal resume data under `data/.` You deserve it.)
3. Open a PR titled like `Add template: your-template-id`
4. In the PR body, include:
  - short description of the layout
  - screenshot or exported PDF from `example.yaml`
  - confirmation you ran preview + build
  - any template-specific YAML fields reviewers should know

Maintainers will check the folder contract, example render, and multi-page/link behavior before merging. Once merged, your template shows up in `npm run templates` for everyone.

## Project Defaults

- Page size: **A4**
- Engine: **Handlebars + HTML/CSS**
- Package manager: **npm**
- Cross-template YAML compatibility is **not** guaranteed — each template owns its schema

## Scripts


| Script                                 | Purpose               |
| -------------------------------------- | --------------------- |
| `npm run preview -- -t <id> -d <yaml>` | Live preview          |
| `npm run build -- -t <id> -d <yaml>`   | One PDF               |
| `npm run build:all`                    | All `data/versions/*` |
| `npm run templates`                    | List templates        |
| `npm run template:create -- <id>`      | Scaffold template     |


## License

MIT# Resumer
