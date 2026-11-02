// Reads ## groups, ### records, metadata bullets, and #### prose/list sections.
// React renders the content as plain text, without executing Markdown HTML.
export function parseMarkdown(source) {
  const groups = new Map();
  let records, record, section;
  let paragraph = [];
  function flush() {
    if (section && paragraph.length) section.paragraphs.push(paragraph.join(' '));
    paragraph = [];
  }
  function newRecord(title) {
    record = { title, fields: {}, sections: {} };
    records.push(record);
    section = record.sections.Body = { paragraphs: [], items: [] };
  }
  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    const heading = /^(#{2,4})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      flush();
      const [, level, title] = heading;
      if (level.length === 2) {
        if (groups.has(title)) throw new Error(`Duplicate Markdown group: ${title}`);
        records = [];
        groups.set(title, records);
        newRecord('');
      } else if (level.length === 3) {
        if (!records) throw new Error(`Markdown record outside a group: ${title}`);
        newRecord(title);
      } else {
        if (!record) throw new Error(`Markdown section outside a record: ${title}`);
        if (record.sections[title]) throw new Error(`Duplicate section: ${record.title} / ${title}`);
        section = record.sections[title] = { paragraphs: [], items: [] };
      }
      continue;
    }
    if (!record) continue;
    if (!line.trim()) { flush(); continue; }
    const field = /^- ([a-z]+):\s*(.*)$/.exec(line);
    if (field && section === record.sections.Body) {
      flush();
      if (Object.hasOwn(record.fields, field[1])) throw new Error(`Duplicate field: ${record.title} / ${field[1]}`);
      record.fields[field[1]] = field[2].trim();
    } else if (/^- /.test(line)) {
      flush();
      section.items.push(line.slice(2).trim());
    } else if (/^\s{2,}\S/.test(line) && section.items.length && !paragraph.length) {
      section.items[section.items.length - 1] += ` ${line.trim()}`;
    } else {
      paragraph.push(line.trim());
    }
  }
  flush();
  return groups;
}

const recordsIn = (document, group) => {
  if (!document.has(group)) throw new Error(`Missing Markdown group: ${group}`);
  return document.get(group).filter(record => record.title);
};
const text = section => [...(section?.paragraphs ?? []), ...(section?.items ?? [])].join(' ');
const field = (record, name) => {
  if (!record.fields[name]) throw new Error(`Missing ${name}: ${record.title || 'Profile'}`);
  return record.fields[name];
};
const list = value => value.split('|').map(item => item.trim()).filter(Boolean);

export function readPortfolio(cvSource, experienceSource) {
  const cv = parseMarkdown(cvSource);
  const notes = parseMarkdown(experienceSource);
  const profileRecord = cv.get('Profile')?.[0];
  if (!profileRecord) throw new Error('Missing Markdown group: Profile');
  const profile = {
    name: field(profileRecord, 'name'), title: field(profileRecord, 'title'),
    contact: `mailto:${field(profileRecord, 'email')}`,
    phone: field(profileRecord, 'phone'),
    telephone: `tel:${field(profileRecord, 'phone').replace(/\s/g, '')}`,
    linkedin: field(profileRecord, 'linkedin'),
    github: field(profileRecord, 'github'),
    leetcode: field(profileRecord, 'leetcode'),
    summary: text(cv.get('Summary')?.[0]?.sections.Body),
  };
  if (!profile.summary) throw new Error('Missing CV summary');
  const cvExperiences = recordsIn(cv, 'Experience');
  const sourceExperiences = ['Working experience', 'Academic experience', 'Personal experience'].flatMap(group => recordsIn(notes, group));
  const sources = new Map();
  for (const record of sourceExperiences) {
    const id = field(record, 'id');
    if (sources.has(id)) throw new Error(`Duplicate experience ID: ${id}`);
    sources.set(id, record);
  }
  const projects = [...recordsIn(notes, 'Projects'), ...recordsIn(cv, 'Projects')].map(record => {
    const source = record.fields.experience ? sources.get(record.fields.experience) : null;
    if (record.fields.experience && !source) throw new Error(`Unknown experience: ${record.fields.experience}`);
    const cvExperience = record.fields.cv ? cvExperiences.find(item => item.fields.id === record.fields.cv) : null;
    if (record.fields.cv && !cvExperience) throw new Error(`Unknown CV experience: ${record.fields.cv}`);
    const project = {
      id: field(record, 'id'), title: record.title,
      emoji: field(record, 'emoji'), color: field(record, 'color'),
      category: field(record, 'category'), organization: field(record, 'organization'),
      station: field(record, 'station'), tags: list(field(record, 'tags')),
      summary: text(record.sections.Summary),
      overview: text(record.sections.Overview ?? source?.sections.Situation),
      built: [...((record.sections['What I built'] ?? source?.sections['Task & Action'])?.items ?? []), ...(cvExperience?.sections.Highlights?.items ?? [])],
      outcome: text(record.sections.Outcome ?? source?.sections.Result),
      video: record.fields.video,
    };
    if (!['Work', 'Research', 'Personal'].includes(project.category)) throw new Error(`Invalid category: ${project.id}`);
    if (!['violet', 'blue', 'mint', 'peach'].includes(project.color)) throw new Error(`Invalid color: ${project.id}`);
    if (!project.summary || !project.overview || !project.built.length || !project.outcome) throw new Error(`Incomplete project: ${project.id}`);
    if (project.video && !/^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(project.video)) throw new Error(`Invalid YouTube video: ${project.id}`);
    return project;
  });
  const projectIds = new Set();
  for (const project of projects) {
    if (projectIds.has(project.id)) throw new Error(`Duplicate project ID: ${project.id}`);
    projectIds.add(project.id);
  }
  function linkedProjects(record) {
    const ids = list(field(record, 'projects'));
    for (const id of ids) if (!projectIds.has(id)) throw new Error(`Unknown linked project: ${id}`);
    return ids;
  }
  const experiences = cvExperiences.map(record => ({
    id: field(record, 'id'), company: record.title, emoji: field(record, 'emoji'), role: field(record, 'role'),
    location: field(record, 'location'), dates: field(record, 'dates'), note: record.fields.note,
    summary: record.sections.Highlights?.items[0] ?? '',
    highlights: record.sections.Highlights?.items.slice(1) ?? [],
    projectIds: linkedProjects(record),
  }));
  const academic = sources.get('cardiac');
  if (academic) experiences.push({
    id: 'cardiac', company: field(academic, 'company'), emoji: field(academic, 'emoji'),
    role: field(academic, 'role'), location: field(academic, 'location'),
    dates: `${field(academic, 'duration')} · research project`,
    summary: text(academic.sections.Situation), highlights: academic.sections['Task & Action']?.items ?? [],
    projectIds: linkedProjects(academic),
  });
  const skills = recordsIn(cv, 'Skills').map(record => ({
    title: record.title, emoji: field(record, 'emoji'), items: record.sections.Tools?.items ?? [],
  }));
  const education = recordsIn(cv, 'Education').map(record => {
    const projectId = field(record, 'project');
    if (!projectIds.has(projectId)) throw new Error(`Unknown education project: ${projectId}`);
    return { title: record.title, emoji: field(record, 'emoji'), school: field(record, 'school'),
      location: field(record, 'location'), thesis: text(record.sections.Thesis),
      internship: text(record.sections.Internship), projectId };
  });
  const stationDescriptions = Object.fromEntries(recordsIn(notes, 'Station introductions').map(record => [field(record, 'id'), text(record.sections.Description)]));
  const publicProjects = recordsIn(notes, 'Public projects').map(record => ({
    id: field(record, 'id'), title: record.title, emoji: field(record, 'emoji'),
    github: field(record, 'github'), demo: record.fields.demo,
    status: record.fields.status, description: text(record.sections.Description),
  }));
  return { profile, projects, publicProjects, experiences, skills, education, stationDescriptions };
}
