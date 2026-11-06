# SMPS Study Website

This repository contains a static revision website for Primary 4 students. The website files are stored under `src/`, and the main entry page is `src/index.html`.

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

Open `src/index.html` in a browser, or serve the `src` folder locally to use the full study hub.

The hub page includes:

- subject cards for Chinese, English, Humanities, Maths, and Science
- exam countdowns stored in `localStorage`
- daily task tracking per subject
- quick links to revision, practice, and games pages
- study tips and exam-day reminders

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
cd d:\kang\smps\src
python -m http.server 8000
```

Then open:

- http://localhost:8000/
- or a subject page such as http://localhost:8000/4a-exam-humanities/revision.html

## Notes

- This project is a pure static site using plain HTML, CSS, and JavaScript.
- There is no backend server or build step.
- Most data is stored in the browser with `localStorage`.
- Image folders such as `scope/` stay local to each subject folder.
- The project root is just the container; the app itself lives in `src/`.

## Typical workflow

- Start at `src/index.html` for the overall study dashboard
- Open a subject page for notes or practice activities
- Use each subject's `games.html` for revision games and quizzes
- Keep progress in the browser; no login or server is required

## License

This project is intended for educational use in a classroom, revision setting, or self-study environment.
