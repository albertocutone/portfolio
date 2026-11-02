import { education, experiences, projects } from '../../config/portfolio.js';
import { getStationContent } from '../../content/stationContent.js';
import ModelCredit from './ModelCredit.jsx';

export default function StationDetails({ station, onOpenProject }) {
  const content = getStationContent(station, { education, experiences, projects });
  return <>
    <h2 id="detail-title">{station.label}</h2>
    <p className="dialog-role">{station.role}</p>
    {content.education.map(item => <section className="project" key={item.title}><span aria-hidden="true">{item.emoji}</span><div>
      <h3>{item.title}</h3><p>{item.school} · {item.location}</p>
      <p><strong>Thesis:</strong> {item.thesis}</p><p>{item.internship}</p>
      <button type="button" className="project-detail-link" onClick={event => onOpenProject(item.projectId, event)}>Explore the thesis ↗</button>
    </div></section>)}
    {content.experiences.map(item => <section className="station-detail-experience" key={item.id}>
      <h3>{item.emoji} {item.company}</h3><p className="dialog-role">{item.role} · {item.location} · {item.dates}</p>
      {item.note && <p className="career-note">{item.note}</p>}
      <p>{item.summary}</p>{item.highlights.length > 0 && <ul>{item.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul>}
    </section>)}
    {content.projects.length > 0 && <section className="station-detail-projects" aria-label="Related projects">
      <h3>Related projects</h3>{content.projects.map(project => <article className="project" key={project.id}>
        <span aria-hidden="true">{project.emoji}</span><div><h3>{project.title}</h3><p>{project.summary}</p>
          <button type="button" className="project-detail-link" onClick={event => onOpenProject(project.id, event)}>What I built & outcomes ↗</button>
        </div>
      </article>)}
    </section>}
    {station.id === 'cern' && <p className="dialog-note">The ATLAS detector model illustrates CERN. My master thesis focused on cryogenic electronic systems for Liquid Argon Time Projection Chambers.</p>}
    <ModelCredit scene={station.scene} className="dialog-note" />
  </>;
}
