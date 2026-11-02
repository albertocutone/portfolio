import { useState } from 'react';
import { projects, publicProjects, experiences, skills, education, profile } from '../../config/portfolio.js';

const categories = ['All', 'Work', 'Research', 'Personal'];
const views = [{ id: 'projects', label: '🗂️ Projects' }, { id: 'experience', label: '💼 Experience' }, { id: 'about', label: '👋 About' }];

export default function PortfolioWindow({ initialView = 'projects', initialProject }) {
  const [view, setView] = useState(initialView);
  const [selectedId, setSelectedId] = useState(initialProject || 'petlog');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [chapter, setChapter] = useState('Overview');
  const filtered = projects.filter(project => (category === 'All' || project.category === category) && `${project.title} ${project.organization} ${project.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase().trim()));
  const selected = filtered.find(project => project.id === selectedId) || filtered[0];

  function openProject(id) {
    setSelectedId(id);
    setCategory('All');
    setQuery('');
    setChapter('Overview');
    setView('projects');
  }

  return <div className="portfolio-app">
    <div className="workspace-toolbar">
      <h2 id="detail-title">My workspace<span>Ideas made real, one project at a time.</span></h2>
      <div className="workspace-views" aria-label="Workspace sections">{views.map(item => <button type="button" key={item.id} aria-pressed={view === item.id} onClick={() => setView(item.id)}>{item.label}</button>)}</div>
    </div>

    {view === 'projects' && <><div className="project-workspace">
      <aside className="project-library" aria-label="Project library">
        <label className="search-label" htmlFor="project-search">Find a project</label>
        <input id="project-search" type="search" placeholder="Search projects or technologies…" value={query} onChange={event => { setQuery(event.target.value); setChapter('Overview'); }} />
        <div className="library-filters" aria-label="Project categories">{categories.map(item => <button type="button" key={item} aria-pressed={category === item} onClick={() => { setCategory(item); setChapter('Overview'); }}>{item}</button>)}</div>
        <p className="library-count" role="status">{filtered.length} {filtered.length === 1 ? 'project' : 'projects'} to explore</p>
        <div className="project-list">{filtered.map(project => <button type="button" className={`project-choice tone-${project.color}`} key={project.id} aria-pressed={selected?.id === project.id} onClick={() => { setSelectedId(project.id); setChapter('Overview'); }}><span className="project-icon" aria-hidden="true">{project.emoji}</span><span><strong>{project.title}</strong><small>{project.category} · {project.organization.split(' · ')[0]}</small></span><span className="choice-arrow" aria-hidden="true">↗</span></button>)}</div>
        {!filtered.length && <p className="empty-library">No matches yet. Try another technology or category.</p>}
      </aside>

      {selected ? <article className={`project-window tone-${selected.color}`} aria-label={`${selected.title} project`}>
        <div className="mini-titlebar"><span className="window-dots" aria-hidden="true"><i /><i /><i /></span><span>project / {selected.id}</span><span aria-hidden="true">↗</span></div>
        <div className="project-content">
          <div className="project-kicker"><span>{selected.category} project</span><span className="big-project-icon" aria-hidden="true">{selected.emoji}</span></div>
          <h3>{selected.title}</h3>
          <p className="project-organization">{selected.organization}</p>
          <p className="project-summary">{selected.summary}</p>
          {selected.video && <a className="project-video-link" href={selected.video} target="_blank" rel="noreferrer">▶ DUNE experiment video ↗</a>}
          <div className="project-chapters" aria-label="Project sections">{['Overview', 'What I built', 'Outcome'].map(item => <button type="button" key={item} aria-pressed={chapter === item} onClick={() => setChapter(item)}>{item === 'Overview' ? '💡' : item === 'What I built' ? '🛠️' : '✨'} {item}</button>)}</div>
          <section className="chapter-content" aria-label={chapter} key={`${selected.id}-${chapter}`}>
            {chapter === 'Overview' && <p>{selected.overview}</p>}
            {chapter === 'What I built' && <ul>{selected.built.map(item => <li key={item}>{item}</li>)}</ul>}
            {chapter === 'Outcome' && <p>{selected.outcome}</p>}
          </section>
          <div className="project-stack"><h4>Tools & technologies</h4><div className="tags">{selected.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div>
          <div className="project-pagination"><span>{projects.findIndex(project => project.id === selected.id) + 1} / {projects.length}</span><button type="button" onClick={() => openProject(projects[(projects.findIndex(project => project.id === selected.id) + 1) % projects.length].id)}>Next project <span aria-hidden="true">→</span></button></div>
        </div>
      </article> : <div className="empty-project"><span aria-hidden="true">🔎</span><h3>Something else in mind?</h3><p>Clear your search to explore the collection.</p><button type="button" onClick={() => { setQuery(''); setCategory('All'); }}>Show all projects</button></div>}
    </div>
    <section className="public-projects" aria-labelledby="public-projects-title">
      <div className="public-projects-heading">
        <div><span className="section-label">🌍 Explore the code</span><h3 id="public-projects-title">Public projects</h3></div>
        <a href={profile.github} target="_blank" rel="noreferrer">All repositories ↗</a>
      </div>
      <div className="public-project-grid">{publicProjects.map(project => <article className="public-project-card" key={project.id}>
        <div className="public-project-title"><span aria-hidden="true">{project.emoji}</span><h4>{project.title}</h4></div>
        {project.status && <span className="public-project-status">{project.status}</span>}
        <p>{project.description}</p>
        <div className="public-project-links">
          {project.demo && <a href={project.demo} target="_blank" rel="noreferrer">Try the demo ↗</a>}
          <a href={project.github} target="_blank" rel="noreferrer">GitHub ↗<span className="sr-only"> — {project.title}</span></a>
        </div>
      </article>)}</div>
    </section></>}

    {view === 'experience' && <div className="experience-page"><div className="page-intro"><span className="section-label">💼 The journey so far</span><h3>From circuits to spatial computing.</h3><p>Software, sensing, and the real-world systems that connect them.</p></div><div className="career-list">{experiences.map(item => <article className="career-card" key={item.company}><span className="career-icon" aria-hidden="true">{item.emoji}</span><div><div className="career-heading"><h4>{item.company}</h4><span>{item.dates}</span></div><p className="career-role">{item.role} · {item.location}</p>{item.note && <p className="career-note">{item.note}</p>}<p className="career-summary">{item.summary}</p>{item.highlights.length > 0 && <details className="career-highlights"><summary>More about this role</summary><ul>{item.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul></details>}<div className="career-projects">{item.projectIds.map(id => { const project = projects.find(entry => entry.id === id); return <button type="button" key={id} onClick={() => openProject(id)}>{project.emoji} {project.title} <span aria-hidden="true">↗</span></button>; })}</div></div></article>)}</div></div>}

    {view === 'about' && <div className="about-page">
      <div className="about-hero">
        <div>
          <span className="section-label">👋 Hello, I'm {profile.name}</span>
          <h3>Hardware curious.<br />Software driven.</h3>
          <p>{profile.summary}</p>
          <div className="contact-actions">
            <a className="primary-link" href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>
            <a href={profile.contact}>✉️ Let's talk</a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
            <a className="secondary-profile" href={profile.leetcode} target="_blank" rel="noreferrer">LeetCode ↗</a>
          </div>
          <a className="phone-link" href={profile.telephone}>📞 {profile.phone}</a>
        </div>
        <div className="about-stamp" aria-hidden="true">ac<span>⚡</span><small>HARDWARE<br />SOFTWARE<br />PERCEPTION</small></div>
      </div>
      <section className="skills-section">
        <h4>🛠️ My toolkit</h4>
        <div className="skill-grid">{skills.map(group => <article className="skill-card" key={group.title}>
          <h5>{group.emoji} {group.title}</h5><p>{group.items.join(' · ')}</p>
        </article>)}</div>
      </section>
      <section className="education-section">
        <h4>🎓 Education</h4>
        {education.map(item => <article key={item.title}>
          <span aria-hidden="true">{item.emoji}</span>
          <div>
            <h5>{item.title}</h5>
            <p>{item.school} · {item.location}</p>
            <p>Thesis: {item.thesis}</p>
            <p>{item.internship}</p>
            <button type="button" onClick={() => openProject(item.projectId)}>Explore the thesis ↗</button>
          </div>
        </article>)}
      </section>
    </div>}
  </div>;
}
