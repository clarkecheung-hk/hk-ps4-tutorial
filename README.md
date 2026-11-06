# SMPS Study Website

This repository contains a static revision website for Primary 4 studies. The app entry point is `src/index.html`, and each subject folder under `src/` holds its own study pages.

## Project structure

```text
smps/
├── .gitignore
├── AGENTS.md
├── README.md
└── src/
    ├── index.html
    ├── 4a-exam-chinese/
    │   ├── index.html
    │   └── games.html
    ├── 4a-exam-english/
    │   ├── index.html
    │   └── games.html
    ├── 4a-exam-humanities/
    │   ├── revision.html
    │   ├── practice.html
    │   ├── games.html
    │   └── assets/
    ├── 4a-exam-math/
    │   ├── revision.html
    │   ├── concepts.html
    │   ├── practice.html
    │   └── games.html
    └── 4a-exam-science/
        ├── revision.html
        ├── practice.html
        └── games.html
```

## App entry point

Open `src/index.html` in a browser, or serve the `src` folder locally to use the full hub page.

The hub page includes:

- subject cards for Chinese, English, Humanities, Maths, and Science
- exam countdowns saved in `localStorage`
- daily task tracking per subject
- quick links to revision, practice, and games pages
- study tips and exam reminders

## Subject folders

| Folder | Subject | Typical pages |
| --- | --- | --- |
| `src/4a-exam-chinese` | 中文 | `index.html`, `games.html` |
| `src/4a-exam-english` | English | `index.html`, `games.html` |
| `src/4a-exam-humanities` | 人文 | `revision.html`, `practice.html`, `games.html` |
| `src/4a-exam-math` | 數學 | `revision.html`, `concepts.html`, `practice.html`, `games.html` |
| `src/4a-exam-science` | 科學 | `revision.html`, `practice.html`, `games.html` |

## How to run locally

From the repo root:

```bash
cd s\src
python -m http.server 8000
```

Then open:

- http://localhost:8000/
- or open a specific page such as http://localhost:8000/4a-exam-humanities/revision.html

## Notes

- This project is a pure static site with plain HTML, CSS, and JavaScript.
- No backend server or build step is required.
- Most data is stored in the browser with `localStorage`.
- Image folders such as `scope/` are kept local to each subject folder.

## Typical workflow

- Open `src/index.html` to see the overall revision dashboard
- Use the linked subject page for notes or exercises
- Play the mini-games from each subject's `games.html`
- Keep progress in the browser; no user account is required

## License

This project is intended for educational use in a classroom, revision setting, or self-study environment.
