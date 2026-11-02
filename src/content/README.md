# Editing portfolio content

The portfolio reads these Markdown files directly through Vite's `?raw` imports. There is no generated content file or Word parser in the app. The CV is an authoring source only; it is not emitted as a downloadable file or linked in the UI.

- **[cv.md](cv.md):** profile and contact details, summary, skills, employment highlights, education, and PetLog.
- **[experiences-and-projects.md](experiences-and-projects.md):** the original working, academic, and personal experience notes; project records; verified public repository/demo links; station introductions.

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
- Stations: `education`, `cern`, `hcl`, `xfarm`, `matica`, `meta`, or `personal`.
- Write `#### Overview`, `#### What I built` (a bullet list), and `#### Outcome` for an independent project.
- Alternatively, `- experience: <id>` reads the matching experience's **Situation**, **Task & Action**, and **Result** directly. Optional `- cv: <id>` adds the corresponding CV employment highlights to the build details. This keeps the source paragraphs in one place.
- Optional `- video: https://www.youtube.com/watch?v=<11-character-id>` adds a project video link. The CERN station embeds its related project's video with muted autoplay while the station is visible; opening a dialog or leaving the station unloads the player.

## Verify changes

Run `npm test` and `npm run build`. The content tests validate the actual Markdown, references, and station coverage. Browser checks in `tests/e2e/workspace.spec.js` cover filters, project selection, career links, public profiles, project destinations, absence of CV controls, and mobile layouts.

## Public links

Profile metadata includes `github`, `linkedin`, and `leetcode`. GitHub is the primary code link; LeetCode is a secondary profile.

The `## Public projects` group contains `###` records with `id`, `emoji`, `github`, optional `demo` and `status`, and a `#### Description`. Only link verified public destinations. Keep design-stage projects labeled appropriately; work-project descriptions do not imply public source availability.

## CV journey

The narrative order in `src/config/stations.js` is Intro → Education → CERN → HCL → xFarm → Matica → Meta → Personal → Recap. CV topics select a pose from `stationPoses`; camera coordinates and model names are separate from content IDs.

Each career station references `experienceIds` from the CV. Its panel shows the role, exact dates, contractor note, and linked projects. Education combines both degree records and thesis projects. Personal projects use their `station` metadata. The final recap brings the journey together and opens the complete workspace.
