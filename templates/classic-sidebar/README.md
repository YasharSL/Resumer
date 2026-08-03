# Classic Sidebar

Clean two-column A4 resume inspired by the CraftWork Studio resume templates.

Template id: `classic-sidebar`

## Layout

- Full-width header (name, title, contact, clickable socials)
- Optional photo
- Full-width Profile summary
- Main column: Employment, Education, Projects
- Sidebar column: Skills (short rules between items)
- Vertical divider between columns; content flows across pages

## Features


| Feature         | Support                                                  |
| --------------- | -------------------------------------------------------- |
| Multi-page      | Yes — document flow + print CSS                          |
| Clickable links | Yes — email / GitHub / LinkedIn / website / project URLs |
| Photo           | Optional via `photo` field                               |




## Schema highlights

- `basics` — name, title, summary, email, phone, location
- `profiles.github|linkedin|website` — `{ url, label? }`
- `photo` — string path or `{ path, alt? }` (resolved relative to the YAML file, then project root)
- `experience[]`, `education[]`, `projects[]`, `skills[]` — arbitrary length



## Develop

```bash
npm run preview -- --template classic-sidebar --data templates/classic-sidebar/example.yaml
npm run build -- --template classic-sidebar --data templates/classic-sidebar/example.yaml
```

Long-content fixture:

```bash
npm run build -- --template classic-sidebar --data data/versions/overflow-fixture.yaml
```



## Rules for edits

- Use `{{#each}}` for scalable sections

