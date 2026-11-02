import cvMarkdown from '../content/cv.md?raw';
import experienceMarkdown from '../content/experiences-and-projects.md?raw';
import { readPortfolio } from '../content/readPortfolio.js';

const content = readPortfolio(cvMarkdown, experienceMarkdown);
export const { projects, publicProjects, experiences, skills, education, stationDescriptions, stationVideos } = content;
export const profile = Object.freeze(content.profile);
