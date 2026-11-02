# Editing portfolio content

The portfolio reads these Markdown files directly through Vite's `?raw` imports. There is no generated content file or Word parser in the app. The same `cv.md` is emitted as the downloadable CV using a `?url` import.

- **[cv.md](cv.md):** profile and contact details, summary, skills, employment highlights, education, and PetLog.
- **[experiences-and-projects.md](experiences-and-projects.md):** the original working, academic, and personal experience notes; project records; station introductions.

Both documents were converted from the supplied Word files. The original situation, actions, results, and reflections are retained. Short project summaries provide readable introductions. Dates come from the CV; durations from the detailed experience document remain labeled as durations.

## Structure

- `##` headings group content. Keep the existing group names.
- `###` headings name individual projects, employers, degrees, and skill groups.
- Metadata bullets before the first `####` heading provide IDs, presentation settings, contact details, and links. Keep IDs stable because other records reference them.
- `####` headings introduce prose or bullet lists. The reader supports plain paragraphs, wrapped lines, and `-` lists. Rich inline Markdown is not rendered in the UI.
- Use ` | ` to separate metadata lists such as technologies and linked project IDs.

## Project records

Each project needs `id`, `emoji`, `color`, `category`, `organization`, `station`, and `tags`, plus a `#### Summary`.

- Categories: `Work`, `Research`, or `Personal`.
- Colors: `violet`, `blue`, `mint`, or `peach`.
- Stations: `sensor`, `instrumentation`, `edge`, or `architecture`.
- Write `#### Overview`, `#### What I built` (a bullet list), and `#### Outcome` for an independent project.
- Alternatively, `- experience: <id>` reads the matching experience's **Situation**, **Task & Action**, and **Result** directly. Optional `- cv: <id>` adds the corresponding CV employment highlights to the build details. This keeps the source paragraphs in one place.

## Verify changes

Run `npm test` and `npm run build`. The content tests validate the actual Markdown, references, and station coverage. Browser checks in `tests/e2e/workspace.spec.js` cover filters, project selection, career links, the Markdown download, and mobile layouts.
