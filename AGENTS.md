# AGENTS

This repository contains a static revision website for Primary 4 students. The actual app files live under `src/`, and the entry page is `src/index.html`.

## Working rules

- Keep changes browser-only and static; do not add a framework, build step, or backend.
- Prefer plain HTML, CSS, and JavaScript edits.
- Preserve the subject folder layout under `src/`.
- Keep page titles, navigation links, and asset paths consistent with each subject's relative structure.
- Keep local image and data files relative to the folder they belong to.
- When updating a page, ensure links still work when opened directly from disk or served over HTTP.

## Local validation

Serve the `src` folder from the repo root:

```bash
cd d:\kang\smps\src
python -m http.server 8000
```

Then browse to:

- http://localhost:8000/
- or a subject page such as http://localhost:8000/4a-exam-humanities/revision.html

## Notes

- Progress and settings are browser-local (`localStorage`) and not sent to a server.
- The project root is only the container; the app itself is inside `src/`.
- Keep all file references relative so the site works without packaging or transpiling.
