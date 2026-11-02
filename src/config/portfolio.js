import cvMarkdown from '../content/cv.md?raw';
import experienceMarkdown from '../content/experiences-and-projects.md?raw';
import cvDownload from '../content/cv.md?url';
import { readPortfolio } from '../content/readPortfolio.js';

const content = readPortfolio(cvMarkdown, experienceMarkdown);
export const { projects, experiences, skills, education, stationDescriptions } = content;
export const profile = Object.freeze({ ...content.profile, cv: cvDownload });
